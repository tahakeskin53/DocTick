using Microsoft.EntityFrameworkCore;
using DocTick.Api.Models;

namespace DocTick.Api.Services;

// 5 dakikada bir: hatırlatma penceresine girmiş ama henüz hatırlatma gönderilmemiş randevular.
// ponytail: Hangfire/Quartz yerine yerleşik BackgroundService + PeriodicTimer — yeterli.
public class ReminderService(IServiceProvider sp, ILogger<ReminderService> log) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(Interval);
        while (!ct.IsCancellationRequested)
        {
            try { await TickAsync(ct); }
            catch (Exception ex) when (!ct.IsCancellationRequested)
            {
                log.LogError(ex, "Hatırlatma tiki başarısız.");
            }
            try { await timer.WaitForNextTickAsync(ct); }
            catch (OperationCanceledException) { }
        }
    }

    private async Task TickAsync(CancellationToken ct)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDb>();
        var email = scope.ServiceProvider.GetRequiredService<EmailService>();

        var setting = await db.Settings.AsNoTracking().FirstAsync(ct);
        if (!setting.ReminderEnabled) return;

        var now = DateTime.Now;

        // ponytail: ReminderHoursBefore penceresini "randevuya kalan süre <= X" olarak yorumluyoruz.
        // Geçmiş randevulara hatırlatma gitmez (start > now şartı).
        var due = await db.Appointments
            .Include(a => a.User)
            .Include(a => a.Doctor!).ThenInclude(d => d!.Department)
            .Where(a => a.Status == ApptStatus.Confirmed && a.ReminderSentAt == null)
            .ToListAsync(ct);

        foreach (var a in due)
        {
            if (!DateTime.TryParseExact($"{a.Date} {a.Time}", "yyyy-MM-dd HH:mm", null,
                    System.Globalization.DateTimeStyles.None, out var start)) continue;
            if (!ReminderWindow.IsDue(start, now, setting.ReminderHoursBefore)) continue;

            var doc = a.Doctor!;
            // Gönderim + ReminderSentAt işareti öğe başına ayrı kaydedilir: bir öğe başarısız olursa
            // diğerleri gönderilip kalıcılaşır, başarısız olan bir sonraki tick'te yeniden denenir.
            // (EmailService başarısız yanıtta fırlatır → catch bu öğeyi atlar, ReminderSentAt set olmaz.)
            try
            {
                await email.SendAsync(a.User!.Email,
                    "DocTick — Randevu hatırlatması",
                    EmailTemplates.Reminder(a.User!.Name, a.Time, doc.Name, doc.Department!.Name, FormatDate(a.Date)));
                a.ReminderSentAt = now;
                await db.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                log.LogWarning(ex, "Hatırlatma gönderilemedi (randevu {Id}); bir sonraki tick'te yeniden denenecek.", a.Id);
            }
        }
    }

    public static string FormatDate(string iso)
    {
        var d = DateTime.ParseExact(iso, "yyyy-MM-dd", null);
        return d.ToString("dd MMM yyyy, ddd", new System.Globalization.CultureInfo("tr-TR"));
    }
}

// Hatırlatma penceresi — ayrı test edilebilen saf yardımcı.
public static class ReminderWindow
{
    // start gelecekte VE start - now <= hoursBefore ise due.
    public static bool IsDue(DateTime start, DateTime now, int hoursBefore) =>
        start > now && start <= now.AddHours(hoursBefore);
}

// Doktor silinirken hangi randevunun iptal edileceğine karar veren saf yardımcı.
// Kural: yalnızca HENÜZ GERÇEKLEŞMEMİŞ randevu iptal edilir; geçmiş randevular
// tarihçe olarak olduğu gibi korunur. Bozuk tarih/saat metni iptal ettirmez.
public static class DoctorRemoval
{
    public static bool ShouldCancel(string date, string time, ApptStatus status, DateTime now) =>
        status == ApptStatus.Confirmed
        && DateTime.TryParseExact($"{date} {time}", "yyyy-MM-dd HH:mm", null,
               System.Globalization.DateTimeStyles.None, out var start)
        && start > now;
}
