# Ek — Güvenlik Notları

Teslim öncesi ve üretime alma için kritik maddeler.

## ⚠️ 1. Canlı API anahtarı — ROTASYON GEREKLİ

**Durum:** `backend/appsettings.json` içinde gerçek bir Resend API anahtarı commit geçmişinde. "Tüm repo" teslim edildiğinde bu anahtar da gider.

**Yapılması gerekenler (sırayla):**

1. **Anahtarı iptal et (REVOKE)** — Resend dashboard → API Keys → `re_4dc8...` anahtarını sil. Artık geçersiz.
2. **Yeni anahtar oluştur** — aynı panelden yeni bir anahtar üret.
3. **Repo'da yer tutucuya çevir** — `backend/appsettings.json` içindeki `Resend:ApiKey` değerini yer tutucu yap:
   ```json
   "ApiKey": "re_BURAYA_KENDI_RESEND_ANAHTARINIZ"
   ```
   (Bu dökümantasyon bu değişikliği repo tarafında yapmıştır — aşağıya bakın.)
4. **Gerçek anahtarı yerel ortam değişkenine koy** (sıfır kod):
   ```powershell
   # PowerShell (geçerli oturum)
   $env:Resend__ApiKey = "re_YENI_ANAHTAR"
   $env:Google__ClientId = "829965...apps.googleusercontent.com"
   $env:Admin__Email = "tahakeskin06@hotmail.com"
   ```
   veya kalıcı olarak user-secrets / sistem ortam değişkeni. ASP.NET Core bu değişkenleri `appsettings.json` üzerinde otomatik geçersiz kılar (çift alt çizgi = bölüm ayracı).
5. **Google Client ID** — bu aslında **public** bir değer (istemci tarafı OAuth ID), gizli değildir; yine de production'da Console'dan ayrı bir client ayırmak temizlik getirir. Teslimde olduğu gibi kalabilir.
6. **Geçmiş temizliği (opsiyonel, titiz)** — `git filter-repo` veya BFG ile eski commit'lerden anahtarı temizleyip force-push. Anahtar zaten iptal edildiği için aciliyeti düşüktür, ancak profesyonel bir teslim için önerilir.

> Bu dökümantasyon, repo tarafındaki adımı (3) uygulamıştır: `appsettings.json`'daki anahtar yer tutucu ile değiştirildi. **Senin yapman gerekenler: 1, 2, 4 (ve opsiyonel 6).**

## 2. Prod-ready kontrol listesi

- [ ] Resend gönderim domaini doğrulanmış; `RedirectTo` kaldırılmış; `FromEmail` kurumsal domainde.
- [ ] HTTPS (ters proxy + `ForwardedHeaders`); `SecurePolicy=Always` uyumlu.
- [ ] Tüm anahtarlar ortam değişkeni/user-secrets'te; `appsettings.json`'da yer tutucu.
- [ ] Google Console: yetkili JS kaynağı + yönlendirme URI üretim alan adıyla.
- [ ] `EnsureCreated` → EF migrations'a geçilmiş (şema evrimi için).
- [ ] Çoklu örnek gerekiyorsa SQLite → PostgreSQL (sağlayıcı EF Core; düşük maliyetli geçiş).
- [ ] Loglama: üretimde `LogLevel` Information'dan uygun seviyeye; hassas veri loglanmıyor.
- [ ] Yedek: `doctick.db` dosyasının düzenli yedeği.

## 3. Bilinen güvenlik özellikleri ve sınırlar

| Özellik | Durum |
|---|---|
| Şifre depolama | Yok — Google OAuth'a dışlandı |
| ID-token doğrulama | Sunucu tarafı, `audience` ile (`GoogleJsonWebSignature`) |
| Cookie | `HttpOnly` + `Secure=Always` + `SameSite=Lax` + 7 gün |
| XSS koruması | Cookie JS'ten erişilemez (`HttpOnly`); iletişim formu metni HTML-encode edilir |
| CSRF | Cookie `SameSite=Lax`; durum değiştiren uçlar `POST` — ek anti-CSRF token yok (Lax + same-origin proxy çoğu vektörü kapatır, üretimde değerlendirilmeli) |
| Rate limiting | Yok — üretimde ekle (özellikle `/api/contact` ve `/api/auth/google`) |
| CORS | Yapılandırılmamış — same-origin proxy varsayımı; farklı origins gerekiyorsa eklenmeli |
| Hata sızıntısı | 500'lerde genel mesaj; doğrulama hataları Türkçe düz metin |

## 4. Veri gizliliği

- Kişisel veri: e-posta, ad, GoogleSub. KVKK/GDPR kapsamında değerlendirilmeli (hasta verisi içerdiği için özellikle hassas).
- `Appointment` kişisel sağlık bilgisi (randevu) içerir — erişim katmanlı (kullanıcı yalnızca kendi randevularını görür, `PatientEndpoints` `uid` ile filtreler).
