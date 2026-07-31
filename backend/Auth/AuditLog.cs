using System.Diagnostics;
using System.Security.Claims;
using System.Text.Json;

namespace DocTick.Api.Auth;

// Durum değiştiren her /api isteğini (POST/PUT/DELETE/PATCH) kalıcı, grep'lenebilir bir JSONL
// dosyasına yazar: <AUTH_AUDIT_DIR>/auth-YYYY-MM-DD.log
//
// Neden endpoint başına çağrı değil de tek middleware: 21 uçta 21 ayrı çağrı, 22.'yi ekleyenin
// unutmasına açıktır (2026-07-31'de prod'u düşüren de tam olarak bu "bir yeri güncellemeyi unutma"
// hatasıydı). Boru hattında tek nokta hem bugünkü hem yarınki uçları kendiliğinden kapsar.
//
// GET'ler KASITLI olarak loglanmaz: denetim kaydı "ne değişti"yi tutar, okuma trafiği dosyayı boğar.
//
// İstek GÖVDELERİ de KASITLI olarak loglanmaz. Gövdelerde T.C. kimlik no, kan grubu, telefon ve
// acil durum kişisi var; bunları düz metin bir dosyaya yazmak sağlık verisi sızdırmak olur.
// Kim / ne / sonuç tutulur, taşınan veri tutulmaz.
public static class AuditLog
{
    const string ItemsKey = "__audit";
    static readonly object _gate = new(); // ponytail: global lock, bu hacimde yeter; artarsa Channel + BackgroundService

    // Ucun kendi bildiği, yoldan okunamayan ayrıntıyı ekler (ör. üretilen randevu kodu).
    // Yolda zaten id varsa (…/users/42/approve) buna gerek yok — middleware yolu zaten yazıyor.
    public static void Event(HttpContext ctx, string evt, string? detail = null)
        => ctx.Items[ItemsKey] = (evt, detail);

    public static IApplicationBuilder UseAuditLog(this IApplicationBuilder app) => app.Use(async (ctx, next) =>
    {
        var m = ctx.Request.Method;
        var mutating = m is "POST" or "PUT" or "DELETE" or "PATCH";
        if (!mutating || !ctx.Request.Path.StartsWithSegments("/api"))
        {
            await next();
            return;
        }

        var sw = Stopwatch.StartNew();
        try
        {
            await next();
        }
        finally
        {
            sw.Stop();
            // HttpContext yanıt tamamlandıktan sonra güvenle okunamaz — alanlar ŞİMDİ, senkron okunur.
            var (evt, detail) = ctx.Items.TryGetValue(ItemsKey, out var v) && v is ValueTuple<string, string?> t
                ? t
                : (null, null);

            var p = ctx.User;
            var authed = p?.Identity?.IsAuthenticated == true;
            Write(new
            {
                ts = DateTime.UtcNow.ToString("o"),
                evt,
                method = m,
                path = ctx.Request.Path.Value,
                status = ctx.Response.StatusCode,
                uid = authed ? CurrentUser.Uid(p!) : (int?)null,
                email = authed ? p!.FindFirst(ClaimTypes.Email)?.Value : null,
                role = authed ? p!.FindFirst(ClaimTypes2.Role)?.Value : null,
                detail,
                ms = sw.ElapsedMilliseconds,
                ip = ctx.Connection.RemoteIpAddress?.ToString(),
                ua = ctx.Request.Headers.UserAgent.ToString(),
            });
        }
    });

    public static void Write(object entry)
    {
        var line = JsonSerializer.Serialize(entry);
        // Prod'da AUTH_AUDIT_DIR=/home/LogFiles/auth → Azure Files (SMB). Dosya yazımı istek yolunda
        // kalırsa her işlem ağ diski gecikmesini öder, üstelik kilit eşzamanlı istekleri sıraya sokar.
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
            Console.Error.WriteLine($"[AuditLog] yazilamadi: {ex.Message}");
        }
    }
}
