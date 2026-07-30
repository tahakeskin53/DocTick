using System.Security.Claims;
using System.Text.Json;

namespace DocTick.Api.Auth;

// Auth olaylarını (login_success / token_invalid / config_error) ve admin yazma işlemlerini
// (admin_action) kalıcı, grep'lenebilir bir JSONL dosyasına yazar: logs/auth-YYYY-MM-DD.log.
public static class AuthAudit
{
    static readonly object _gate = new(); // ponytail: global lock, dev/düşük hacim için yeter; hacim artarsa kanal/kuyruk

    public static void Write(HttpContext ctx, string evt, string? email = null, string? reason = null, string? target = null)
    {
        // HttpContext yanıt tamamlandıktan sonra güvenle okunamaz — alanlar ŞİMDİ, senkron okunur.
        var line = JsonSerializer.Serialize(new
        {
            ts = DateTime.UtcNow.ToString("o"),
            evt,
            email,
            target,
            reason,
            ip = ctx.Connection.RemoteIpAddress?.ToString(),
            ua = ctx.Request.Headers.UserAgent.ToString(),
        });

        // Prod'da AUTH_AUDIT_DIR=/home/LogFiles/auth → Azure Files (SMB). Dosya yazımı istek yolunda
        // kalırsa her giriş ağ diski gecikmesini öder, üstelik kilit eşzamanlı girişleri sıraya sokar.
        // ponytail: fire-and-forget; süreç yazım tamamlanmadan ölürse son satır(lar) kaybolabilir —
        // audit için kabul edilen üst sınır. Garanti gerekirse Channel + BackgroundService'e yükselt.
        var dir = Environment.GetEnvironmentVariable("AUTH_AUDIT_DIR") ?? Path.Combine(Directory.GetCurrentDirectory(), "logs");
        _ = Task.Run(() => Append(dir, line));
    }

    static void Append(string dir, string line)
    {
        try
        {
            lock (_gate)
            {
                Directory.CreateDirectory(dir);
                var filePath = Path.Combine(dir, $"auth-{DateTime.UtcNow:yyyy-MM-dd}.log");
                using var fs = new FileStream(filePath, FileMode.Append, FileAccess.Write, FileShare.ReadWrite);
                using var writer = new StreamWriter(fs);
                writer.WriteLine(line);
            }
        }
        catch (Exception ex)
        {
            // Arka plan görevinde yakalanmayan istisna süreci düşürebilir — audit yazımı uygulamayı öldürmemeli.
            Console.Error.WriteLine($"[AuthAudit] yazilamadi: {ex.Message}");
        }
    }
}
