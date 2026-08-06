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
    // Doluysa TÜM e-postalar bu adrese yönlendirilir (Resend test modu kısıtı için geçici köprü).
    // Domain doğrulanınca boş bırak → e-posta gerçek alıcıya gider.
    public string RedirectTo { get; set; } = "";
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

        // Test köprüsü: RedirectTo doluysa gerçek alıcı yerine oraya gönder, konuya orijinal alıcıyı ekle.
        var actualTo = string.IsNullOrWhiteSpace(_opt.RedirectTo) ? to : _opt.RedirectTo;
        var actualSubject = string.IsNullOrWhiteSpace(_opt.RedirectTo) ? subject : $"{subject} [→ {to}]";

        var body = JsonSerializer.Serialize(new
        {
            from = $"{_opt.FromName} <{_opt.FromEmail}>",
            to = new[] { actualTo },
            subject = actualSubject,
            html,
            // Logo her e-postaya CID ile gömülür — harici resim URL'leri istemcilerce engellenir, CID engellenmez.
            attachments = new[] { new { filename = "logo.png", content = EmailTemplates.LogoPngB64, content_id = "doctick-logo" } }
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
    // Beyaz DocTick ikonu, 96x96 PNG (logo-icon.svg'den üretildi). CID eki olarak her e-postaya gömülür.
    public const string LogoPngB64 = "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";

    private static string Shell(string title, string bodyHtml) => $@"
<!doctype html><html lang='tr'><body style='margin:0;padding:24px 12px;font-family:IBM Plex Sans,Arial,sans-serif;color:#12222F;background:#F1F5F9'>
<table role='presentation' width='100%' cellpadding='0' cellspacing='0'><tr><td align='center'>
<table role='presentation' width='480' cellpadding='0' cellspacing='0' style='max-width:480px;width:100%;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E3E9EE'>
  <tr><td style='background:#164478;padding:22px 24px'>
    <table role='presentation' cellpadding='0' cellspacing='0'><tr>
      <td valign='middle' style='padding-right:12px'><img src='cid:doctick-logo' width='36' height='36' alt='' style='display:block'></td>
      <td valign='middle'>
        <div style='font-family:Sora,Arial,sans-serif;font-weight:800;font-size:20px;letter-spacing:-.02em;color:#fff'>DocTick</div>
        <div style='font-size:12px;color:#9DBBDD;margin-top:2px'>Doktorunuz bir tık uzağınızda</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style='padding:26px 24px'>
    <h2 style='font-family:Sora,Arial,sans-serif;font-size:18px;margin:0 0 14px;color:#12222F'>{title}</h2>
    {bodyHtml}
  </td></tr>
  <tr><td style='padding:16px 24px;border-top:1px solid #EEF2F6;background:#FAFBFC'>
    <p style='font-size:12px;color:#8A99A6;margin:0'>Bu e-posta DocTick randevu sistemi tarafından gönderildi.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>";

    // E-posta istemcileri flex/grid'i çoğu zaman yok sayar → tablo tabanlı, inline stilli kart.
    private static string Appt(string time, string doctor, string dept, string date) => $@"
<table role='presentation' width='100%' cellpadding='0' cellspacing='0' style='margin:18px 0;border:1px solid #E3E9EE;border-radius:12px;overflow:hidden'>
  <tr><td style='background:#164478;padding:11px 20px;font-family:Sora,Arial,sans-serif;font-size:13px;font-weight:600;color:#DCE7F4;letter-spacing:.03em'>{date}</td></tr>
  <tr><td style='padding:18px 20px;background:#fff'>
    <table role='presentation' cellpadding='0' cellspacing='0'><tr>
      <td valign='middle' style='padding-right:18px'>
        <div style='background:#EEF4FB;border:1px solid #CFE0F2;border-radius:10px;padding:10px 18px;text-align:center'>
          <div style='font-family:IBM Plex Mono,monospace;font-weight:700;font-size:24px;color:#1B5493;line-height:1'>{time}</div>
        </div>
      </td>
      <td valign='middle'>
        <div style='font-family:Sora,Arial,sans-serif;font-weight:700;font-size:16px;color:#12222F'>{doctor}</div>
        <div style='font-size:13px;color:#51626F;margin-top:3px'>{dept}</div>
      </td>
    </tr></table>
  </td></tr>
</table>";

    public static string Confirmation(string name, string time, string doctor, string dept, string date, string code) =>
        Shell("Randevunuz oluşturuldu",
            $"<p>Sayın {name},</p><p>Randevunuz onaylandı.</p>{Appt(time, doctor, dept, date)}" +
            $"<p style='font-size:13px;color:#51626F;margin:0 0 10px'>Onay kodunuz: <b style='font-family:IBM Plex Mono,monospace;color:#1B5493;font-size:14px'>{code}</b></p>" +
            "<p style='font-size:13px;color:#51626F'>İptal için randevudan en az 2 saat önce işlem yapın.</p>");

    public static string Cancellation(string name, string time, string doctor, string dept, string date) =>
        Shell("Randevunuz iptal edildi",
            $"<p>Sayın {name},</p><p>Aşağıdaki randevunuz iptal edilmiştir.</p>{Appt(time, doctor, dept, date)}");

    // Kurum kaynaklı zorunlu iptal (ör. doktorun kadrodan çıkarılması). Sebep bilerek
    // genel tutulur — hastaya iç işleyiş anlatılmaz, kurumla iletişime yönlendirilir.
    public static string Disruption(string name, string time, string doctor, string dept, string date, string code) =>
        Shell("Randevunuz iptal edildi",
            $"<p>Sayın {name},</p><p>Yaşanan bir aksaklık nedeniyle aşağıdaki randevunuz <b>iptal edilmiştir</b>. Oluşan olumsuzluk için özür dileriz.</p>{Appt(time, doctor, dept, date)}" +
            $"<p style='font-size:13px;color:#51626F;margin:0 0 10px'>Randevu kodunuz: <b style='font-family:IBM Plex Mono,monospace;color:#1B5493;font-size:14px'>{code}</b></p>" +
            "<p style='font-size:14px'>Yeni bir randevu planlamak ve ayrıntılı bilgi almak için lütfen <b>kurumumuzla iletişime geçin</b>.</p>");

    public static string Reminder(string name, string time, string doctor, string dept, string date) =>
        Shell("Randevu hatırlatması",
            $"<p>Sayın {name}, randevunuz yaklaşıyor.</p>{Appt(time, doctor, dept, date)}");

    public static string Approved(string name) =>
        Shell("Hesabınız onaylandı",
            $"<p>Merhaba {name},</p><p>DocTick hesabınız onaylandı. Artık randevu alabilirsiniz.</p>");

    public static string Rejected(string name) =>
        Shell("Hesap başvurunuz",
            $"<p>Merhaba {name},</p><p>Üzgünüz, hesap başvurunuz şu anda onaylanamadı.</p>");

    // İletişim formu — gönderen bilgisi + mesaj (metinler çağıran tarafta HTML-encode edilir).
    public static string Contact(string name, string fromEmail, string subject, string messageHtml) =>
        Shell($"İletişim formu: {subject}",
            $"<p style='font-size:13px;color:#51626F;margin:0 0 4px'>Gönderen: <b style='color:#12222F'>{System.Net.WebUtility.HtmlEncode(name)}</b> · {System.Net.WebUtility.HtmlEncode(fromEmail)}</p>" +
            $"<div style='background:#F7F9FB;border:1px solid #E3E9EE;border-radius:10px;padding:14px 16px;margin-top:12px;font-size:14px;line-height:1.6'>{messageHtml}</div>");

    // Admin'in iletişim mesajına yanıtı — orijinal mesaj Contact(...) şablonundaki gri alıntı
    // kutusuyla aynı düzende altta gösterilir, hasta neye yanıt geldiğini hatırlar.
    // name/subject burada, originalHtml/replyHtml çağıran tarafta HTML-encode edilir (Contact ile aynı desen).
    public static string ContactReply(string name, string subject, string originalHtml, string replyHtml) =>
        Shell("Mesajınıza yanıt",
            $"<p>Sayın {System.Net.WebUtility.HtmlEncode(name)},</p>" +
            $"<div style='font-size:14px;line-height:1.6'>{replyHtml}</div>" +
            $"<p style='font-size:13px;color:#51626F;margin:18px 0 4px'>Mesajınız — {System.Net.WebUtility.HtmlEncode(subject)}:</p>" +
            $"<div style='background:#F7F9FB;border:1px solid #E3E9EE;border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.6'>{originalHtml}</div>");
}
