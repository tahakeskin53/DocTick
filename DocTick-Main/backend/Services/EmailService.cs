using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace DocTick.Api.Services;

public class EmailOptions
{
    public string ApiKey { get; set; } = "";
    public string FromEmail { get; set; } = "randevu@doctick.example";
    public string FromName { get; set; } = "DocTick";
}

// Resend REST API — resmi SDK yerine tek HttpClient (ponytail: ek bağımlılık yok).
// ponytail: API anahtarı yoksa sessizce no-op + log; geliştirme sırasında çökmez.
public class EmailService(IHttpClientFactory http, IOptions<EmailOptions> opt, ILogger<EmailService> log)
{
    private readonly EmailOptions _opt = opt.Value;

    public async Task SendAsync(string to, string subject, string html)
    {
        if (string.IsNullOrWhiteSpace(_opt.ApiKey))
        {
            log.LogWarning("Resend API anahtarı yok — e-posta gönderilmedi. Kime={To} Konu={Subject}", to, subject);
            return;
        }

        var body = JsonSerializer.Serialize(new
        {
            from = $"{_opt.FromName} <{_opt.FromEmail}>",
            to = new[] { to },
            subject,
            html
        });

        var req = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _opt.ApiKey);

        var client = http.CreateClient("resend");
        var res = await client.SendAsync(req);
        if (!res.IsSuccessStatusCode)
        {
            var text = await res.Content.ReadAsStringAsync();
            log.LogError("Resend hatası {Status}: {Body}", (int)res.StatusCode, text);
            // Başarısız gönderim hataya dönüşür: hatırlatma servisi bu randevuyu
            // "gönderildi" işaretlemeyip bir sonraki tick'te yeniden denesin.
            throw new InvalidOperationException($"Resend {(int)res.StatusCode}: {text}");
        }
    }
}

// Markanın inline HTML şablonları — ayrı template motoru yok. Tek tırnaklı öznitelikler
// (verbatim interpolated string) ile kaçış karmaşası yok.
public static class EmailTemplates
{
    private static string Shell(string title, string bodyHtml) => $@"
<!doctype html><html lang='tr'><body style='margin:0;font-family:IBM Plex Sans,Arial,sans-serif;color:#12222F;background:#F7F9FB'>
<div style='max-width:480px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E3E9EE'>
  <div style='background:#164478;color:#fff;padding:18px 22px;font-family:Sora,Arial,sans-serif;font-weight:800;font-size:18px;letter-spacing:-.02em'>DocTick</div>
  <div style='padding:22px'>
    <h2 style='font-family:Sora,Arial,sans-serif;font-size:17px;margin:0 0 12px'>{title}</h2>
    {bodyHtml}
    <p style='font-size:12px;color:#70808C;margin-top:18px'>Bu e-posta DocTick randevu sistemi tarafından gönderildi.</p>
  </div>
</div></body></html>";

    private static string Appt(string time, string doctor, string dept, string date) =>
        $"<div style='display:flex;gap:14px;align-items:center;background:#EEF2F6;border-radius:10px;padding:12px 16px;margin:10px 0'>" +
        $"<span style='font-family:IBM Plex Mono,monospace;font-weight:600;font-size:20px;color:#1B5493'>{time}</span>" +
        $"<span>{doctor} · {dept} · {date}</span></div>";

    public static string Confirmation(string name, string time, string doctor, string dept, string date, string code) =>
        Shell("Randevunuz oluşturuldu",
            $"<p>Sayın {name},</p><p>Randevunuz onaylandı. Onay kodunuz <b>{code}</b>.</p>{Appt(time, doctor, dept, date)}" +
            "<p style='font-size:13px;color:#51626F'>İptal için randevudan en az 2 saat önce işlem yapın.</p>");

    public static string Cancellation(string name, string time, string doctor, string dept, string date) =>
        Shell("Randevunuz iptal edildi",
            $"<p>Sayın {name},</p><p>Aşağıdaki randevunuz iptal edilmiştir.</p>{Appt(time, doctor, dept, date)}");

    public static string Reminder(string name, string time, string doctor, string dept, string date) =>
        Shell("Randevu hatırlatması",
            $"<p>Sayın {name}, randevunuz yaklaşıyor.</p>{Appt(time, doctor, dept, date)}");

    public static string Approved(string name) =>
        Shell("Hesabınız onaylandı",
            $"<p>Merhaba {name},</p><p>DocTick hesabınız onaylandı. Artık randevu alabilirsiniz.</p>");

    public static string Rejected(string name) =>
        Shell("Hesap başvurunuz",
            $"<p>Merhaba {name},</p><p>Üzgünüz, hesap başvurunuz şu anda onaylanamadı.</p>");
}
