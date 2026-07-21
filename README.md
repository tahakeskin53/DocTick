# DocTick — Hastane Online Randevu Sistemi

Hastaneden online randevu alma, görüntüleme, hatırlatma ve değerlendirme. İki yüzey:
**Hasta uygulaması** ve **Admin paneli** (bölüm/doktor/saat yönetimi + kullanıcı onayı + e-posta ayarları).

## Teknoloji yığını (Temmuz 2026)

- **Backend:** .NET 10, ASP.NET Core Minimal API, EF Core 10 + SQLite, Google.Apis.Auth, Resend (raw HttpClient)
- **Frontend:** Vite 8, React 19, TypeScript 6, React Router v8, TanStack Query v5, @react-oauth/google
- **Tasarım:** `DocTick Design System/` (önceden hazırdı — frontend'e taşındı)

## Sizden gereken 2 anahtar (kod başlamadan önce)

### 1. Google OAuth Client ID
Google Cloud Console → APIs & Services → Credentials → **OAuth 2.0 Client ID** (Web application).
- Authorized JavaScript origins: `http://localhost:5173`
- **Aynı Client ID'yi iki yere** koyun (backend audience doğrulaması için birebir aynı olmalı):
  - `frontend/.env.local` → `VITE_GOOGLE_CLIENT_ID=<client_id>`
  - `backend/appsettings.json` → `"Google": { "ClientId": "<client_id>" }`

### 2. Resend API anahtarı
[resend.com](https://resend.com) → API keys. `backend/appsettings.json` içindeki:
```json
"Resend": { "ApiKey": "<buraya_api_key>", "FromEmail": "...", "FromName": "DocTick" }
```
> Ücretsiz katta doğrulanmış domain yoksa Resend yalnızca **hesap sahibinin e-postasına** gönderir.
> Anahtar yoksa uygulama yine çalışır; e-postalar sadece gönderilmez (loglanır).

Admin e-postası `backend/appsettings.json` → `Admin:Email` = `tahakeskin5306@gmail.com`.
Bu adresle ilk Google girişi otomatik **Admin + Active** olur.

## Çalıştırma (iki süreç)

```bash
# 1) Backend — http://localhost:5080 (API + Scalar belgeleri)
cd backend
dotnet run --urls http://localhost:5080
#   İlk açılışta doctick.db oluşturulur ve seed (5 bölüm, 6 doktor, 300 saat) atılır.

# 2) Frontend — http://localhost:5173
cd frontend
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` → Google ile giriş. Vite `/api` isteklerini 5080'e proxy'ler (aynı köken, cookie sorunsuz).

## Uçtan uca test senaryosu

1. Kendi Google hesabınla (admin e-postası) giriş → otomatik admin → `/admin`.
2. Başka bir Google hesabıyla (örn. 2. tarayıcı/profil) giriş → **onay bekliyor** ekranı.
3. Admin → Kullanıcılar → o kullanıcıyı **Onayla** (onay e-postası gider).
4. Onaylanan hasta → randevu al (bölüm → doktor → tarih → saat → onay) → onay e-postası.
5. Randevularım → iptal → iptal e-postası.
6. `ReminderHoursBefore`'u küçük değere çek + yakın tarihli randevu → hatırlatma e-postası (5 dk içinde).
7. Geçmiş bir randevuya 5 yıldız değerlendirme.

## Yapı

```
backend/            .NET 10 API (Models, Auth, Endpoints, Services, doctick.db)
backend.Tests/      xunit — müsaitlik, çifte rezervasyon (kısmi unique indeks), hatırlatma penceresi
frontend/           Vite + React 19 (src/styles tasarım tokenları, src/components tasarım sistemi)
DocTick Design System/  kaynak tasarım (referans)
```

## Testler

```bash
dotnet test backend.Tests/DocTick.Api.Tests.csproj   # 6 test
```

## Üretime (tek origin)

```bash
cd frontend && npm run build                # dist/
# dist içeriğini backend/wwwroot altına kopyalayın, sonra:
cd ../backend && dotnet publish -c Release   # SPA + API aynı origin'den servis edilir
```
(Cookie `SameSite=Lax` tek origin'da sorunsuz çalışır.)

## Belgeler

- API: çalışırken `http://localhost:5080/scalar` (Scalar UI) ve `/openapi/v1.json`.
- Tasarım sistemi: `DocTick Design System/readme.md`.
