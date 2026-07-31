using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using DocTick.Api.Endpoints;
using DocTick.Api.Models;

namespace DocTick.Api.Tests;

// Doktor tarafının iki sabiti:
//   1. Yetki: doktor yalnız KENDİSİYLE randevusu olmuş hastaya dokunabilir.
//   2. DTO: randevu satırındaki hasta kimliği doğru taşınmalı — bir kez randevu Id'si
//      gönderildiği için sonuçlar yanlış hastaya bağlanmıştı.
public class DoctorAccessTests
{
    // İki doktor, iki hasta. A doktorunun randevusu yalnız 1. hastayla.
    // Id'ler BİLEREK çakışmıyor: randevu Id'si ile hasta Id'si aynı sayı olsaydı
    // aşağıdaki DTO testi hatayı yakalayamazdı.
    private static (AppDb db, Doctor docA, Doctor docB, User hasta1, User hasta2, Appointment appt) Seed(SqliteConnection c)
    {
        var db = new AppDb(new DbContextOptionsBuilder<AppDb>().UseSqlite(c).Options);
        db.Database.EnsureCreated();

        var dept = new Department { Name = "Kardiyoloji" };
        db.Departments.Add(dept);
        db.SaveChanges();

        var docA = new Doctor { Name = "Uzm. Dr. A", DepartmentId = dept.Id };
        var docB = new Doctor { Name = "Uzm. Dr. B", DepartmentId = dept.Id };
        db.Doctors.AddRange(docA, docB);

        // Hasta Id'leri 1 ve 2 olacak. Randevuları sonra ekleyip Id'lerin ayrışmasını sağlıyoruz.
        var hasta1 = new User { Email = "h1@ornek.com", Name = "Hasta Bir", GoogleSub = "sub-1", Status = UserStatus.Active };
        var hasta2 = new User { Email = "h2@ornek.com", Name = "Hasta Iki", GoogleSub = "sub-2", Status = UserStatus.Active };
        db.Users.AddRange(hasta1, hasta2);
        db.SaveChanges();

        // Beş dolgu randevu: gerçek randevunun Id'si hasta Id'lerinden uzaklaşsın.
        // Tarihler ayrı olmalı — (UserId, Date, Time) üzerindeki çifte rezervasyon
        // indeksi aynı hastaya aynı anda ikinci onaylı randevu yazdırmaz.
        for (var i = 0; i < 5; i++)
            db.Appointments.Add(new Appointment
            {
                Code = $"RND-2026-900{i}", UserId = hasta2.Id, DoctorId = docB.Id,
                Date = $"2020-01-0{i + 1}", Time = "09:00", CreatedAt = DateTime.UtcNow,
            });
        db.SaveChanges();

        var appt = new Appointment
        {
            Code = "RND-2026-0001", UserId = hasta1.Id, DoctorId = docA.Id,
            Date = "2026-07-30", Time = "09:30", Status = ApptStatus.Confirmed, CreatedAt = DateTime.UtcNow,
        };
        db.Appointments.Add(appt);
        db.SaveChanges();

        return (db, docA, docB, hasta1, hasta2, appt);
    }

    [Fact]
    public async Task KendiHastasina_Erisebilir()
    {
        using var c = new SqliteConnection("DataSource=:memory:");
        c.Open();
        var (db, docA, _, hasta1, _, _) = Seed(c);
        using (db)
            Assert.True(await DoctorEndpoints.CanTouchAsync(db, docA.Id, hasta1.Id, default));
    }

    // Asıl koruma: A doktoru, B doktorunun hastasının sonuçlarına ulaşamaz.
    [Fact]
    public async Task BaskaDoktorunHastasina_Erisemez()
    {
        using var c = new SqliteConnection("DataSource=:memory:");
        c.Open();
        var (db, docA, _, _, hasta2, _) = Seed(c);
        using (db)
            Assert.False(await DoctorEndpoints.CanTouchAsync(db, docA.Id, hasta2.Id, default));
    }

    // İptal edilmiş randevu da bağ sayılır: hasta gerçekten bu doktora gelmiş,
    // sonucu görebilmesi gerekir. Kural daralırsa bu test uyarır.
    [Fact]
    public async Task IptalliRandevu_BagSayilir()
    {
        using var c = new SqliteConnection("DataSource=:memory:");
        c.Open();
        var (db, docA, _, hasta1, _, appt) = Seed(c);
        using (db)
        {
            appt.Status = ApptStatus.Cancelled;
            db.SaveChanges();
            Assert.True(await DoctorEndpoints.CanTouchAsync(db, docA.Id, hasta1.Id, default));
        }
    }

    // Regresyon kilidi: DoktorRandevular.tsx bir süre `patientId: activeAppt.id` gönderdi,
    // yani randevu Id'sini hasta Id'si sandı. Sonuçlar yanlış hastaya bağlanırdı.
    // DTO'nun hasta kimliğini doğru taşıdığını burada sabitliyoruz.
    [Fact]
    public void Dto_HastaKimligini_RandevuIdsiyle_Karistirmaz()
    {
        using var c = new SqliteConnection("DataSource=:memory:");
        c.Open();
        var (db, _, _, hasta1, _, appt) = Seed(c);
        using (db)
        {
            var row = db.Appointments.Include(a => a.User).First(a => a.Id == appt.Id);
            var dto = DoctorEndpoints.ToDto(row);

            Assert.Equal(hasta1.Id, dto.PatientId);
            Assert.Equal("Hasta Bir", dto.PatientName);
            // Fixture'ın işi: bu iki sayı ayrışmazsa test yukarıdaki hatayı yakalayamaz.
            Assert.NotEqual(dto.Id, dto.PatientId);
        }
    }
}
