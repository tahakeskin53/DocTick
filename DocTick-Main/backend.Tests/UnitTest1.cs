using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using DocTick.Api.Models;
using DocTick.Api.Services;

namespace DocTick.Api.Tests;

// Gerçek SQLite (bellek içi, açık tutulan bağlantı) — kısmi unique indeks dahil şema birebir oluşur.
// ponytail: InMemory sağlayıcı unique indeksleri zorlamaz; bu yüzden SQLite kullanıyoruz.
public class DbTests
{
    private static SqliteConnection OpenShared()
    {
        var c = new SqliteConnection("DataSource=:memory:");
        c.Open();
        return c;
    }

    private static AppDb NewDb(SqliteConnection c)
    {
        var db = new AppDb(new DbContextOptionsBuilder<AppDb>().UseSqlite(c).Options);
        db.Database.EnsureCreated();
        return db;
    }

    // Ortak seed: 1 bölüm, 1 doktor, yarınlık gün tüm slotlar açık, 1 aktif kullanıcı.
    private static async Task<(SqliteConnection conn, int doctorId, string date, int userId)> SeedAsync()
    {
        var conn = OpenShared();
        var db = NewDb(conn);
        var dept = new Department { Name = "Kardiyoloji", IsActive = true };
        db.Departments.Add(dept);
        await db.SaveChangesAsync();
        var doc = new Doctor { Name = "Uzm. Dr. Ayşe Demir", DepartmentId = dept.Id, IsActive = true };
        db.Doctors.Add(doc);
        await db.SaveChangesAsync();
        var tomorrow = DateTime.Today.AddDays(1);
        var date = tomorrow.ToString("yyyy-MM-dd");
        var dow = (int)tomorrow.DayOfWeek;
        foreach (var t in Slots.All)
            db.ScheduleSlots.Add(new ScheduleSlot { DoctorId = doc.Id, DayOfWeek = dow, Time = t, IsOpen = true });
        var u = new User { GoogleSub = "sub1", Email = "hasta@x.com", Name = "Hasta", Status = UserStatus.Active };
        db.Users.Add(u);
        await db.SaveChangesAsync();
        var userId = u.Id;
        await db.DisposeAsync();
        return (conn, doc.Id, date, userId);
    }

    private static async Task AddApptAsync(SqliteConnection c, int doctorId, int userId, string date, string time, ApptStatus status, string code)
    {
        var db = NewDb(c);
        db.Appointments.Add(new Appointment { UserId = userId, DoctorId = doctorId, Date = date, Time = time, Status = status, Code = code });
        try { await db.SaveChangesAsync(); }
        finally { await db.DisposeAsync(); }
    }

    [Fact]
    public async Task Index_IsPartial_OnConfirmedOnly()
    {
        var conn = OpenShared();
        var db = NewDb(conn);
        var sql = await db.Database.SqlQueryRaw<string>(
            "SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='Appointments' AND sql IS NOT NULL").ToListAsync();
        await db.DisposeAsync();
        Assert.Contains(sql, s => s.Contains("WHERE", StringComparison.OrdinalIgnoreCase) && s.Contains("Status", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Availability_ExcludesAlreadyBookedSlot()
    {
        var (conn, doctorId, date, userId) = await SeedAsync();
        await AddApptAsync(conn, doctorId, userId, date, "09:30", ApptStatus.Confirmed, "RND-1");

        var db = NewDb(conn);
        var taken = await db.Appointments.AsNoTracking()
            .Where(a => a.DoctorId == doctorId && a.Date == date && a.Status == ApptStatus.Confirmed)
            .Select(a => a.Time).ToListAsync();
        var avail = Slots.All.Except(taken).OrderBy(t => t).ToList();
        Assert.DoesNotContain("09:30", avail);
        Assert.Contains("09:00", avail);
        Assert.Contains("10:00", avail);
    }

    [Fact]
    public async Task UniqueIndex_PreventsDoubleBooking_ButAllowsRebookingCancelled()
    {
        var (conn, doctorId, date, userId) = await SeedAsync();
        var d2 = DateTime.Today.AddDays(2).ToString("yyyy-MM-dd");

        await AddApptAsync(conn, doctorId, userId, d2, "10:00", ApptStatus.Confirmed, "A1");

        // Aynı yuvaya ikinci Confirmed → unique ihlali beklenir.
        await Assert.ThrowsAsync<DbUpdateException>(() =>
            AddApptAsync(conn, doctorId, userId, d2, "10:00", ApptStatus.Confirmed, "A2"));

        // İptal edilmiş randevunun yuvası yeniden rezerve edilebilmeli (partial index yalnız Confirmed'i korur).
        await AddApptAsync(conn, doctorId, userId, d2, "11:00", ApptStatus.Cancelled, "C1");
        await AddApptAsync(conn, doctorId, userId, d2, "11:00", ApptStatus.Confirmed, "A3");
    }
}

public class ReminderWindowTests
{
    [Fact]
    public void IsDue_TrueWhenWithinWindow()
    {
        var now = new DateTime(2026, 7, 21, 12, 0, 0);
        Assert.True(ReminderWindow.IsDue(now.AddHours(3), now, 24));
        Assert.True(ReminderWindow.IsDue(now.AddHours(24), now, 24));
    }

    [Fact]
    public void IsDue_FalseWhenPastOrBeyondWindow()
    {
        var now = new DateTime(2026, 7, 21, 12, 0, 0);
        Assert.False(ReminderWindow.IsDue(now.AddMinutes(-1), now, 24));   // geçmiş
        Assert.False(ReminderWindow.IsDue(now.AddHours(25), now, 24));      // pencere dışı
        Assert.False(ReminderWindow.IsDue(now, now, 24));                   // tam şu an (start>now değil)
    }

    [Fact]
    public void FormatDate_ProducesTurkishLabel()
    {
        Assert.Equal("24 Tem 2026, Cum", ReminderService.FormatDate("2026-07-24"));
    }
}
