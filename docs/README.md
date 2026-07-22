# DocTick — Teknik Dökümantasyon

Hastane online randevu sisteminin teknik el kitabı. Hedef kitle: **teknik jüri / mentor**. Tüm diyagramlar [Mermaid](https://mermaid.js.org/) sözdizimiyle yazılmıştır — GitHub, VS Code ve herhangi bir Markdown görüntüleyicide render olur.

> Tarih: Temmuz 2026 · Durum: kod tabanının güncel anlık görüntüsü (commit `3aaf655`)

## Hızlı başlangıç

```bash
# 1) Backend (API + DB)  — http://localhost:5080
cd backend
dotnet run --urls http://localhost:5080

# 2) Frontend (Vite)     — http://localhost:5173  (tarayıcıyı açar)
cd frontend
npm install        # ilk kurulum
npm run dev
```

Windows için tek tıkla: repo kökündeki `baslat.bat`. Çalışma öncesi gerekli anahtarlar için → [`09-altyapi-calisma.md`](09-altyapi-calisma.md).

## Döküman indeksi

| # | Belge | Ne anlatır |
|---|---|---|
| 01 | [Genel Bakış](01-genel-bakis.md) | Amaç, özellikler, teknoloji yığını |
| 02 | [Mimari](02-mimari.md) | **Sistem mimarisi diyagramı**, katmanlar, veri akışı |
| 03 | [Proje Yapısı](03-proje-yapisi.md) | **Tam repo ağacı**, her klasörün görevi |
| 04 | [Veri Modeli](04-veri-modeli.md) | **ERD**, entity'ler, enum'lar, çift-rezervasyon indeksi |
| 05 | [API Endpoint'leri](05-api-endpointleri.md) | Tüm uçlar (method/route/auth/açıklama) |
| 06 | [Kimlik Doğrulama & Yetki](06-kimlik-dogrulama.md) | **Google OAuth sequence**, cookie, ActiveGuard |
| 07 | [Randevu Akışı](07-randevu-akisi.md) | **Randevu oluşturma sequence**, 409/çift-rezervasyon |
| 08 | [Frontend](08-frontend.md) | Rota haritası, guard'lar, sayfalar, tasarım sistemi |
| 09 | [Altyapı & Çalışma](09-altyapi-calisma.md) | Portlar, proxy, `baslat.bat`, yapılandırma, deployment |
| 10 | [Testler](10-testler.md) | Senaryolar, in-memory SQLite gerekçesi |
| 11 | [Geliştirme Araçları](11-gelistirme-araclari.md) | Claude Code + memkraft + skills katmanı |
| — | [Ek: Güvenlik Notları](ekler/guvenlik-notlari.md) | Gizli anahtar rotasyonu, prod-ready maddeleri |

## Karar kayıtları (ADR)

Mimari tercihler ve *neden*'leri: [`adr/`](adr/) klasöründe. Özet:

- [ADR-0001](adr/0001-minimal-api-sqlite-ensurecreated.md) — Minimal API + SQLite, `EnsureCreated` (migration yok)
- [ADR-0002](adr/0002-google-oauth-idtoken-cookie.md) — Google OAuth ID-token + sunucu tarafı cookie
- [ADR-0003](adr/0003-partial-unique-index-cift-rezervasyon.md) — Çift-rezervasyon engeli: uygulama kontrolü + partial unique index
- [ADR-0004](adr/0004-activeguard-endpoint-filter.md) — `ActiveGuard` endpoint filtresi (claim stale problemi)
- [ADR-0005](adr/0005-resend-raw-http-redirect-to.md) — Resend raw HTTP (SDK yok) + `RedirectTo` test köprüsü
- [ADR-0006](adr/0006-runtime-css-in-js-dtinject.md) — Runtime CSS-in-JS (`dtInject`), CSS framework yok
- [ADR-0007](adr/0007-react-router-v8-same-origin-proxy.md) — React Router v8 + same-origin Vite proxy (CORS yok)

## Alan sözlüğü

Terimlerin kanonik adları ve kaçınılması gereken eşanlamlıları: kökteki [`../CONTEXT.md`](../CONTEXT.md).
