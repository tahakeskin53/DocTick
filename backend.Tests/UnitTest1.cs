using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using DocTick.Api.Auth;
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

    [Fact]
    public async Task UniqueIndex_PreventsUserDoubleBooking_AcrossDoctors()
    {
        var (conn, doctorId, date, userId) = await SeedAsync();
        var d = DateTime.Today.AddDays(2).ToString("yyyy-MM-dd");

        // İkinci doktor (farklı bölüm) — aynı kullanıcı, aynı tarih+saat, farklı doktor senaryosu için.
        var db0 = NewDb(conn);
        var dept2 = new Department { Name = "Dermatoloji", IsActive = true };
        db0.Departments.Add(dept2);
        await db0.SaveChangesAsync();
        var doc2 = new Doctor { Name = "Dr. Zeynep Arslan", DepartmentId = dept2.Id, IsActive = true };
        db0.Doctors.Add(doc2);
        await db0.SaveChangesAsync();
        await db0.DisposeAsync();

        // Kullanıcı 1. doktora 10:00 alır.
        await AddApptAsync(conn, doctorId, userId, d, "10:00", ApptStatus.Confirmed, "A1");
        // Aynı kullanıcı, aynı tarih+saat, FARKLI doktor → unique ihlali beklenir (kullanıcı ekseni).
        await Assert.ThrowsAsync<DbUpdateException>(() =>
            AddApptAsync(conn, doc2.Id, userId, d, "10:00", ApptStatus.Confirmed, "A2"));
    }
}

public class AuthAuditTests
{
    // Dosya yazımı artık istek yolunda değil (arka plan) — satır hemen değil, kısa süre içinde görünür.
    static string? WaitForLine(string path, string marker, int timeoutMs = 5000)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        while (sw.ElapsedMilliseconds < timeoutMs)
        {
            if (File.Exists(path))
            {
                try
                {
                    using var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                    using var sr = new StreamReader(fs);
                    string? line = null;
                    string? match = null;
                    while ((line = sr.ReadLine()) is not null)
                    {
                        if (line.Contains(marker)) match = line;
                    }
                    if (match is not null) return match;
                }
                catch (IOException) { /* eşzamanlı yazma sürüyor — tekrar dene */ }
            }
            Thread.Sleep(25);
        }
        return null;
    }

    // AuthAudit.Write bugünkü auth-*.log dosyasına geçerli JSON bir satır eklemeli.
    [Fact]
    public void Write_AppendsParsableJsonLine()
    {
        var ctx = new DefaultHttpContext();
        var marker = "test-" + Guid.NewGuid().ToString("N");
        AuditLog.Write(new { evt = marker, email = "a@b.c", reason = "sebep-x" });

        var path = Path.Combine(Directory.GetCurrentDirectory(), "logs", $"auth-{DateTime.UtcNow:yyyy-MM-dd}.log");
        var last = WaitForLine(path, marker);
        Assert.NotNull(last); // süre içinde yazılmadıysa arka plan yazımı bozuk
        using var doc = JsonDocument.Parse(last!); // parse edilemezse fırlatır → test kırılır
        Assert.Equal(marker, doc.RootElement.GetProperty("evt").GetString());
        Assert.Equal("a@b.c", doc.RootElement.GetProperty("email").GetString());
        Assert.Equal("sebep-x", doc.RootElement.GetProperty("reason").GetString());
    }
}

public class SlotsTests
{
    [Fact]
    public void Days_IncludeWeekend_ButDefaultOpenDoesNot()
    {
        // Izgara Cmt(6) ve Paz(0) dahil tüm günleri gösterir.
        Assert.Contains(6, Slots.Days);
        Assert.Contains(0, Slots.Days);
        // Ama hafta sonu varsayılan olarak KAPALI gelir (admin açana dek).
        Assert.DoesNotContain(6, Slots.DefaultOpenDays);
        Assert.DoesNotContain(0, Slots.DefaultOpenDays);
        // Hafta içi varsayılan açık.
        foreach (var d in new[] { 1, 2, 3, 4, 5 })
            Assert.Contains(d, Slots.DefaultOpenDays);
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

public class UserGateTests
{
    static SqliteConnection OpenShared()
    {
        var c = new SqliteConnection("DataSource=:memory:");
        c.Open();
        return c;
    }

    static AppDb NewDb(SqliteConnection c)
    {
        var db = new AppDb(new DbContextOptionsBuilder<AppDb>().UseSqlite(c).Options);
        db.Database.EnsureCreated();
        return db;
    }

    // Önbellek gerçekten sorguyu atlamalı (bayat değer döner) ve Invalidate onu anında tazelemeli.
    [Fact]
    public async Task Caches_UntilInvalidated()
    {
        var conn = OpenShared();
        var seed = NewDb(conn);
        var u = new User { GoogleSub = "s1", Email = "a@b.c", Name = "Hasta", Status = UserStatus.Active };
        seed.Users.Add(u);
        await seed.SaveChangesAsync();
        var uid = u.Id;
        await seed.DisposeAsync();

        var cache = new MemoryCache(new MemoryCacheOptions());
        var gate = new UserGate(NewDb(conn), cache);

        Assert.Equal(UserStatus.Active, (await gate.GetAsync(uid))!.Status);

        // Durumu DB'de ayrı bir bağlamdan değiştir — önbellek bunu görmemeli.
        var other = NewDb(conn);
        (await other.Users.FirstAsync(x => x.Id == uid)).Status = UserStatus.Rejected;
        await other.SaveChangesAsync();
        await other.DisposeAsync();

        Assert.Equal(UserStatus.Active, (await gate.GetAsync(uid))!.Status); // bayat = önbellek çalışıyor

        gate.Invalidate(uid);

        // Invalidate sonrası taze okuma için yeni bir DbContext (aynı bağlantı, aynı veri).
        var fresh = new UserGate(NewDb(conn), cache);
        Assert.Equal(UserStatus.Rejected, (await fresh.GetAsync(uid))!.Status);
    }
}

public class ProfileTests
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

    [Fact]
    public async Task ProfileUpdate_ChangesUserNameInDb()
    {
        using var conn = OpenShared();
        var seed = NewDb(conn);
        var u = new User { GoogleSub = "sub1", Email = "hasta@x.com", Name = "Ahmet Yilmaz", FirstName = "Ahmet", LastName = "Yilmaz", Status = UserStatus.Active };
        seed.Users.Add(u);
        await seed.SaveChangesAsync();
        var uid = u.Id;
        await seed.DisposeAsync();

        var db = NewDb(conn);
        var user = await db.Users.FirstAsync(x => x.Id == uid);
        user.FirstName = "Mehmet";
        user.LastName = "Kaya";
        user.Name = $"{user.FirstName} {user.LastName}";
        user.PhoneNumber = "05551234567";
        user.IdentityNumber = "12345678901";
        user.DateOfBirth = "1990-05-15";
        user.Gender = "Erkek";
        user.BloodType = "A Rh+";
        user.EmergencyContactName = "Ayse Kaya";
        user.EmergencyContactPhone = "05559876543";
        await db.SaveChangesAsync();

        var dbCheck = NewDb(conn);
        var updated = await dbCheck.Users.FirstAsync(x => x.Id == uid);
        Assert.Equal("Mehmet Kaya", updated.Name);
        Assert.Equal("Mehmet", updated.FirstName);
        Assert.Equal("Kaya", updated.LastName);
        Assert.Equal("05551234567", updated.PhoneNumber);
        Assert.Equal("12345678901", updated.IdentityNumber);
        Assert.Equal("1990-05-15", updated.DateOfBirth);
        Assert.Equal("Erkek", updated.Gender);
        Assert.Equal("A Rh+", updated.BloodType);
        Assert.Equal("Ayse Kaya", updated.EmergencyContactName);
        Assert.Equal("05559876543", updated.EmergencyContactPhone);
    }


}

