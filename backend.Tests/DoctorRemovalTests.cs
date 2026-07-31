using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using DocTick.Api.Models;
using DocTick.Api.Services;

namespace DocTick.Api.Tests;

// Doktor silme kuralı: geçmiş randevular tarihçe olarak korunur, yalnızca henüz
// gerçekleşmemiş onaylı randevular iptal edilir.
public class DoctorRemovalTests
{
    private static readonly DateTime Now = new(2026, 7, 31, 12, 00, 00);

    [Fact]
    public void AyniGunSonrakiSaat_IptalEdilir() =>
        Assert.True(DoctorRemoval.ShouldCancel("2026-07-31", "14:00", ApptStatus.Confirmed, Now));

    [Fact]
    public void YarinkiRandevu_IptalEdilir() =>
        Assert.True(DoctorRemoval.ShouldCancel("2026-08-01", "09:00", ApptStatus.Confirmed, Now));

    [Fact]
    public void AyniGunGecmisSaat_Korunur() =>
        Assert.False(DoctorRemoval.ShouldCancel("2026-07-31", "09:00", ApptStatus.Confirmed, Now));

    [Fact]
    public void DunkuRandevu_Korunur() =>
        Assert.False(DoctorRemoval.ShouldCancel("2026-07-30", "23:30", ApptStatus.Confirmed, Now));

    // start > now: tam o dakikadaki randevu başlamış sayılır, iptal edilmez.
    [Fact]
    public void TamBaslangicAni_Korunur() =>
        Assert.False(DoctorRemoval.ShouldCancel("2026-07-31", "12:00", ApptStatus.Confirmed, Now));

    [Fact]
    public void ZatenIptalli_TekrarIptalEdilmez() =>
        Assert.False(DoctorRemoval.ShouldCancel("2026-08-01", "09:00", ApptStatus.Cancelled, Now));

    [Fact]
    public void BozukTarihSaat_IptalEttirmez() =>
        Assert.False(DoctorRemoval.ShouldCancel("", "", ApptStatus.Confirmed, Now));

    // 1 bölüm + 1 doktor + 1 kullanıcı + 1 geçmiş randevu. Bağlantı açık tutulur (bellek içi DB).
    private static (AppDb db, Doctor doc) Seed(SqliteConnection c)
    {
        var db = new AppDb(new DbContextOptionsBuilder<AppDb>().UseSqlite(c).Options);
        db.Database.EnsureCreated();

        var dept = new Department { Name = "Kardiyoloji" };
        db.Departments.Add(dept);
        var user = new User { Email = "hasta@ornek.com", Name = "Hasta", GoogleSub = "sub-1", Status = UserStatus.Active };
        db.Users.Add(user);
        db.SaveChanges();

        var doc = new Doctor { Name = "Dr. Test", DepartmentId = dept.Id };
        db.Doctors.Add(doc);
        db.SaveChanges();

        db.Appointments.Add(new Appointment
        {
            Code = "RND-2026-0001", UserId = user.Id, DoctorId = doc.Id,
            Date = "2020-01-01", Time = "09:00", Status = ApptStatus.Confirmed, CreatedAt = DateTime.UtcNow
        });
        db.SaveChanges();
        return (db, doc);
    }

    // Yumuşak silmenin GEREKÇESİ: Appointments.DoctorId FK'si ON DELETE CASCADE.
    // Gerçek DELETE hastaların randevu geçmişini de silerdi. Bu test o kısıtı sabitler —
    // biri endpoint'i `db.Doctors.Remove(doc)`a geri çevirirse neyin kaybolacağını gösterir.
    [Fact]
    public void GercekDelete_RandevulariDaSilerdi()
    {
        using var c = new SqliteConnection("DataSource=:memory:");
        c.Open();
        var (db, doc) = Seed(c);
        using (db)
        {
            Assert.Equal(1, db.Appointments.Count());

            db.Doctors.Remove(doc);
            db.SaveChanges();

            Assert.Equal(0, db.Appointments.Count()); // cascade geçmişi sildi → yumuşak silme şart
        }
    }

    // Yumuşak silme aynı senaryoda geçmişi korur.
    [Fact]
    public void YumusakSilme_GecmisiKorur()
    {
        using var c = new SqliteConnection("DataSource=:memory:");
        c.Open();
        var (db, doc) = Seed(c);
        using (db)
        {
            doc.IsDeleted = true;
            doc.IsActive = false;
            db.SaveChanges();

            Assert.Equal(1, db.Appointments.Count());
            // Randevu okumaları hâlâ doktor adına ulaşabiliyor (admin randevu listesi buna bağlı).
            var appt = db.Appointments.Include(a => a.Doctor).First();
            Assert.Equal("Dr. Test", appt.Doctor!.Name);
            // Ama doktor listelerde görünmüyor.
            Assert.Empty(db.Doctors.Where(d => !d.IsDeleted).ToList());
        }
    }
}
