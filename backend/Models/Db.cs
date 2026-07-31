using Microsoft.EntityFrameworkCore;

namespace DocTick.Api.Models;

public enum UserRole { Patient, Admin }
public enum UserStatus { Pending, Active, Rejected }
public enum ApptStatus { Confirmed, Cancelled }

// "Done" durumu DB'de tutulmaz; okuma sırasında randevu tarihi+saati geçmişse hesaplanır.
// ponytail: bir durum sütunu yerine türetilmiş görünüm — daha az tutarsızlık yüzeyi.

public class User
{
    public int Id { get; set; }
    public string GoogleSub { get; set; } = "";
    public string Email { get; set; } = "";
    public string Name { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string PhoneNumber { get; set; } = "";
    public string IdentityNumber { get; set; } = "";
    public string DateOfBirth { get; set; } = "";
    public string Gender { get; set; } = "";
    public string BloodType { get; set; } = "";
    public string EmergencyContactName { get; set; } = "";
    public string EmergencyContactPhone { get; set; } = "";
    public UserRole Role { get; set; } = UserRole.Patient;
    public UserStatus Status { get; set; } = UserStatus.Pending;
    public DateTime CreatedAt { get; set; }
}



public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public List<Doctor> Doctors { get; set; } = new();
}

public class Doctor
{
    public int Id { get; set; }
    public string Name { get; set; } = ""; // unvan dahil: "Uzm. Dr. Ayşe Demir"
    public int DepartmentId { get; set; }
    public Department? Department { get; set; }
    public bool IsActive { get; set; } = true;
    public string PhotoUrl { get; set; } = "";
    // Silinen doktor satırı DB'de kalır: Appointments.DoctorId FK'si ON DELETE CASCADE olduğu için
    // gerçek DELETE hastaların randevu geçmişini de silerdi. Listelerden gizlenir, randevu
    // okumaları (a.Doctor!.Name) çalışmaya devam eder.
    public bool IsDeleted { get; set; }
}
#line 51 "C:\Users\tahak\OneDrive\Masaüstü\STAJ\staj projeler\DocTick\backend\Models\Db.cs"

// Haftalık şablon: admin'in saat ızgarası. 0=Pazar..6=Cumartesi (.NET DayOfWeek ile uyumlu).
public class ScheduleSlot
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public int DayOfWeek { get; set; }
    public string Time { get; set; } = ""; // "09:30"
    public bool IsOpen { get; set; }
}

public class Appointment
{
    public int Id { get; set; }
    public string Code { get; set; } = ""; // "RND-2026-0007"
    public int UserId { get; set; }
    public User? User { get; set; }
    public int DoctorId { get; set; }
    public Doctor? Doctor { get; set; }
    public string Date { get; set; } = ""; // "yyyy-MM-dd"
    public string Time { get; set; } = "";  // "HH:mm"
    public ApptStatus Status { get; set; } = ApptStatus.Confirmed;
    public int? Rating { get; set; } // 1..5, değerlendirilene kadar null
    public DateTime? ReminderSentAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Setting
{
    public int Id { get; set; } // her zaman 1 (tek satır)
    public bool ReminderEnabled { get; set; } = true;
    public int ReminderHoursBefore { get; set; } = 24;
}

// Tüm randevu saatleri tek bir yerde — admin ızgarası ve müsaitlik buradan beslenir.
public static class Slots
{
    public static readonly string[] All =
        ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:30", "14:00", "14:30", "15:00"];
    // Izgarada gösterilen tüm günler, sıralı: Pzt=1..Cmt=6, Paz=0 (.NET DayOfWeek).
    public static readonly int[] Days = [1, 2, 3, 4, 5, 6, 0];
    // Varsayılan açık günler (hafta içi). Hafta sonu (Cmt/Paz) slotları oluşturulur ama kapalı gelir.
    public static readonly int[] DefaultOpenDays = [1, 2, 3, 4, 5];
}

public class AppDb(DbContextOptions<AppDb> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<ScheduleSlot> ScheduleSlots => Set<ScheduleSlot>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Setting> Settings => Set<Setting>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Enum'ları metin olarak sakla — filtreli indeks ve sorgular okunaklı olsun.
        b.Entity<User>().Property(u => u.Role).HasConversion<string>();
        b.Entity<User>().Property(u => u.Status).HasConversion<string>();
        b.Entity<Appointment>().Property(a => a.Status).HasConversion<string>();

        b.Entity<User>().HasIndex(u => u.GoogleSub).IsUnique();
        b.Entity<ScheduleSlot>().HasIndex(s => new { s.DoctorId, s.DayOfWeek, s.Time }).IsUnique();

        // Çifte rezervasyonun sert garantisi: aynı doktor+tarih+saat için yalnızca tek Confirmed.
        // ponytail: SQLite kısmi(partial) unique indeks — eşzamanlı iki isteğin ikisini de yazması engellenir.
        b.Entity<Appointment>()
            .HasIndex(a => new { a.DoctorId, a.Date, a.Time })
            .IsUnique()
            .HasFilter("\"Status\" = 'Confirmed'");

        // Kullanıcı ekseni sert garanti: aynı kişi aynı tarih+saatte iki Confirmed tutamaz (farklı doktor olsa bile).
        b.Entity<Appointment>()
            .HasIndex(a => new { a.UserId, a.Date, a.Time })
            .IsUnique()
            .HasFilter("\"Status\" = 'Confirmed'");

        b.Entity<Setting>().HasData(new Setting
        {
            Id = 1,
            ReminderEnabled = true,
            ReminderHoursBefore = 24
        });
    }
}

public static class DbSeeder
{
    public static async Task EnsureSchemaAsync(AppDb db)
    {
        var cols = new[]
        {
            ("Users", "FirstName", "TEXT NOT NULL DEFAULT ''"),
            ("Users", "LastName", "TEXT NOT NULL DEFAULT ''"),
            ("Users", "PhoneNumber", "TEXT NOT NULL DEFAULT ''"),
            ("Users", "IdentityNumber", "TEXT NOT NULL DEFAULT ''"),
            ("Users", "DateOfBirth", "TEXT NOT NULL DEFAULT ''"),
            ("Users", "Gender", "TEXT NOT NULL DEFAULT ''"),
            ("Users", "BloodType", "TEXT NOT NULL DEFAULT ''"),
            ("Users", "EmergencyContactName", "TEXT NOT NULL DEFAULT ''"),
            ("Users", "EmergencyContactPhone", "TEXT NOT NULL DEFAULT ''"),
            ("Doctors", "PhotoUrl", "TEXT NOT NULL DEFAULT ''"),
            ("Doctors", "IsDeleted", "INTEGER NOT NULL DEFAULT 0")
        };

        foreach (var (table, colName, colType) in cols)
        {
            try
            {
                await db.Database.ExecuteSqlRawAsync($"ALTER TABLE \"{table}\" ADD COLUMN \"{colName}\" {colType};");
            }
            catch
            {
                // Kolon zaten var, geç.
            }
        }
    }

    // Seed verisi tasarım sisteminden (data.js) alındı.
    public static async Task SeedAsync(AppDb db, string adminEmail)
    {
        if (await db.Departments.AnyAsync()) return;


        var depts = new (string id, string name)[]
        {
            ("kar", "Kardiyoloji"), ("der", "Dermatoloji"), ("goz", "Göz Hastalıkları"),
            ("ort", "Ortopedi"), ("kbb", "Kulak Burun Boğaz")
        };
        var deptByName = new Dictionary<string, Department>();
        foreach (var (_, name) in depts)
        {
            var d = new Department { Name = name, IsActive = true };
            db.Departments.Add(d);
            deptByName[name] = d;
        }
        await db.SaveChangesAsync();

        var docs = new (string name, string dept)[]
        {
            ("Uzm. Dr. Ayşe Demir", "Kardiyoloji"),
            ("Prof. Dr. Mehmet Kaya", "Kardiyoloji"),
            ("Dr. Zeynep Arslan", "Dermatoloji"),
            ("Doç. Dr. Murat Şahin", "Göz Hastalıkları"),
            ("Dr. Elif Çetin", "Ortopedi"),
            ("Uzm. Dr. Can Yılmaz", "Kulak Burun Boğaz"),
        };
        foreach (var (name, dept) in docs)
        {
            var doc = new Doctor { Name = name, DepartmentId = deptByName[dept].Id, IsActive = true };
            db.Doctors.Add(doc);
            await db.SaveChangesAsync();
            // Varsayılan plan: tüm günler oluşturulur; hafta içi açık, hafta sonu (Cmt/Paz) kapalı gelir.
            foreach (var dow in Slots.Days)
                foreach (var t in Slots.All)
                    db.ScheduleSlots.Add(new ScheduleSlot { DoctorId = doc.Id, DayOfWeek = dow, Time = t, IsOpen = Slots.DefaultOpenDays.Contains(dow) });
        }
        await db.SaveChangesAsync();

        // Admin kullanıcısı henüz yoksa işaretlenmek üzere e-posta notu — gerçek kayıt Google ile giriş yapınca olur.
        // (GoogleSub bilinmediği için şimdiden satır eklemiyoruz; AuthEndpoints ilk girişte rol atayacak.)
        _ = adminEmail;
    }
}
