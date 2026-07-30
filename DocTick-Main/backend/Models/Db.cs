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
}

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
    // hafta içi günler (Pzt=1 .. Cuma=5)
    public static readonly int[] Weekdays = [1, 2, 3, 4, 5];
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
    // Program.cs tarafından çağrılan şema-uyumluluk kancası.
    // Şu an için ek işlem gerekmiyor; yöntem bilerek idempotent/no-op.
    public static Task EnsureSchemaAsync(AppDb db)
    {
        ArgumentNullException.ThrowIfNull(db);
        return Task.CompletedTask;
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
            // Varsayılan haftalık plan: tüm hafta içi günler, tüm saatler açık.
            foreach (var dow in Slots.Weekdays)
                foreach (var t in Slots.All)
                    db.ScheduleSlots.Add(new ScheduleSlot { DoctorId = doc.Id, DayOfWeek = dow, Time = t, IsOpen = true });
        }
        await db.SaveChangesAsync();

        // Admin kullanıcısı henüz yoksa işaretlenmek üzere e-posta notu — gerçek kayıt Google ile giriş yapınca olur.
        // (GoogleSub bilinmediği için şimdiden satır eklemiyoruz; AuthEndpoints ilk girişte rol atayacak.)
        _ = adminEmail;
    }
}
