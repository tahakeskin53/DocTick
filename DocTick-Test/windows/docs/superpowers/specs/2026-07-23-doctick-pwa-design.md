# DocTick PWA — Tasarım (Spec)

**Tarih:** 2026-07-23 · **Durum:** Onaylandı (tasarım görüşmesinde) · **Kapsam kararı:** Kurulabilir PWA + app-shell önbelleği + çevrimdışı "Randevularım" · **Yaklaşım:** `vite-plugin-pwa`

## 1. Amaç

DocTick SPA'sını (hasta + admin, tek uygulama) telefona **"Ana ekrana ekle"** ile kurulabilen, tam ekran (standalone) açılan bir PWA yapmak. Uygulama kabuğu önbelleğe alınır; internet yokken uygulama yine açılır ve **Randevularım** son bilinen haliyle salt-okunur gösterilir.

Kaynak dokümantasyon: [docs.pwabuilder.com](https://docs.pwabuilder.com/) — PWA'nın üç zorunlu bileşeni: **web manifest + service worker + HTTPS** (localhost muaf).

## 2. Kapsam dışı

- **Web Push bildirimleri** (hatırlatma e-postaları mevcut ve yeterli; push, backend'e VAPID + abonelik saklama ister).
- **Background sync / periodic sync.**
- **Mağaza paketleri** (Google Play TWA, Microsoft Store MSIX, iOS). Bu tasarım kapıyı kapatmaz — bkz. §9.
- **PWABuilder scorecard doğrulaması** — yalnızca halka açık URL ile çalışır; uygulama deploy edilirse koşulacak adım olarak not edildi (§9).

## 3. Teknik yaklaşım kararı

`vite-plugin-pwa` (Workbox tabanlı, tek dev-dependency). Gerekçe: Vite her build'de hash'li dosya adları ürettiğinden el yazması `sw.js`'te precache listesi kırılgan olur ve service worker güncelleme yaşam döngüsü (`skipWaiting`, bayat HTML) bilinen tuzak alanıdır. Eklenti; manifest enjeksiyonu, build çıktılarının otomatik precache'i ve `autoUpdate` güncelleme akışını hazır verir. Alternatifler (el yazması SW, PWABuilder Starter şablonuna taşıma) değerlendirilip elendi.

## 4. Web Manifest

`vite.config.ts` içinde `VitePWA({ manifest: {...} })` ile üretilir:

| Alan | Değer |
|---|---|
| `name` / `short_name` | `DocTick` / `DocTick` |
| `description` | Hastane online randevu sistemi |
| `lang` / `dir` | `tr` / `ltr` |
| `start_url` / `scope` / `id` | `/` / `/` / `/` |
| `display` | `standalone` |
| `theme_color`, `background_color` | Tasarım tokenlarından (`src/styles`) HEX olarak |
| `icons` | `logo-icon.svg`'den üretilen PNG'ler: **192 (`any`) + 512 (`any`) + ayrı 512 (`maskable`)** |
| `shortcuts` | "Randevu Al" → `/randevu-al`, "Randevularım" → `/randevularim` |

İkon kuralları PWABuilder doğrulamasıyla birebir: en az bir `purpose: any`, en az bir 512×512, maskable **ayrı girdi** (çift amaçlı `any maskable` yok).

## 5. Service Worker

- `registerType: 'autoUpdate'` — yeni build yayınlanınca SW kendini sessizce günceller.
- **Precache:** tüm build çıktıları (JS/CSS/HTML/ikon) — eklenti otomatik üretir.
- **Runtime cache — tek kural:** `GET /api/appointments` (Randevularım listesi) → `NetworkFirst` (önce ağ; ağ yoksa son önbelleklenen yanıt). Workbox route'ları varsayılan olarak yalnız GET ile eşleşir; aynı yola giden `POST /api/appointments` (randevu oluşturma) hiçbir zaman önbelleklenmez.
- **Asla önbelleklenmeyenler:** `/api/auth/*` (oturum durumu daima taze), tüm mutasyonlar, diğer tüm `/api/*` GET'leri (müsaitlik/bölüm/doktor verisi bayat gösterilmez).
- **Navigasyon fallback:** çevrimdışıyken SPA route'ları precache'teki `index.html`'e düşer — kabuk her koşulda açılır.

## 6. Çevrimdışı UX

- `navigator.onLine` + `online`/`offline` olaylarıyla global bir **"çevrimdışısınız" uyarı bandı**.
- **Randevularım:** SW sayesinde son bilinen liste normal akışla render edilir; banttaki metin "son bilinen liste" olduğunu söyler; **İptal** ve değerlendirme butonları çevrimdışıyken devre dışı.
- Ağ isteyen diğer sayfalar (randevu alma, admin) çevrimdışıyken kibar bir "internet bağlantısı gerekli" durumu gösterir; mevcut hata yolları üzerine minimal ekleme.

## 7. index.html / platform ayrıntıları

- `<meta name="theme-color">` eklenir.
- `apple-touch-icon` (180×180 PNG) eklenir — iOS Safari "Ana ekrana ekle" için.
- Standalone modda çentikli ekranlar için safe-area (`env(safe-area-inset-*)`) kontrolü; gerekirse yalnızca layout kapsayıcılarına padding.
- **Üretim düzeltmesi:** README "dist'i `backend/wwwroot`'a kopyala" dese de `Program.cs`'te statik dosya servisi henüz yok. Plana küçük bir görev eklendi: `UseDefaultFiles` + `UseStaticFiles` + SPA fallback + `sw.js`/`index.html`/`manifest.webmanifest` için `Cache-Control: no-cache`.
- Android/Chrome'da kurulu PWA aynı tarayıcı profilini paylaşır → mevcut cookie (`SameSite=Lax`, tek origin) ve Google OAuth popup akışı çalışır; uçtan uca test senaryosuna eklenir (§8).

## 8. Doğrulama (ponytail çalışır-kontrolü dahil)

1. **Chrome/Edge DevTools → Application sekmesi** ile kurulabilirlik denetimi: Manifest bölümündeki hata/uyarılar, Service Worker durumu, Cache Storage içeriği. (Not: Lighthouse v12+ ayrı PWA kategorisini kaldırdı; DevTools Application paneli güncel doğrulama yolu. Localhost SW için güvenli bağlam sayılır, HTTPS gerekmez.)
2. **Kurulum testi:** masaüstü Edge/Chrome "Uygulamayı yükle"; Android'de `chrome://inspect` port yönlendirme ile gerçek cihazda kurulum.
3. **Uçtan uca:** kurulu PWA'dan Google girişi → randevu al → uçak modu → uygulamayı aç → kabuk açılır + Randevularım son haliyle görünür + banner çıkar.
4. **Otomatik kontrol (tek script):** build sonrası `dist/` içindeki manifest'i assert eden küçük Node script'i (`name`, `short_name` ≥ 3, 512 ikon var, maskable ayrı girdi, `start_url`) — kırılırsa build pipeline'da yakalanır.

## 9. Gelecek: mağaza paketleme kapısı (bilgi notu)

Bu tasarım PWABuilder paketleme ön koşullarını şimdiden karşılar (tam manifest + SW). Eksik tek ön koşul: **halka açık HTTPS URL**. Deploy edilirse sıra: pwabuilder.com'a URL → scorecard → paket üret:

- **Google Play:** TWA (Bubblewrap) paketi; `assetlinks.json` sunucu köküne konur, Play imzası sonrası SHA-256 ile güncellenir; 25$ tek seferlik hesap.
- **Microsoft Store:** `.msixbundle` + `.classic.appxbundle`; Partner Center'dan Package/Publisher ID; 19$ hesap.
- **iOS:** Swift/WKWebView sarmalayıcı; Mac + Xcode + 99$/yıl. **Risk:** Google, embedded webview'da OAuth girişini engelleyebilir — iOS paketi gündeme gelirse giriş akışı yeniden değerlendirilmeli.

## 10. Dokunulacak dosyalar (özet)

- `frontend/vite.config.ts` — `VitePWA` eklentisi + manifest + runtime kural
- `frontend/index.html` — theme-color, apple-touch-icon
- `frontend/public/` — üretilen PNG ikonlar (192/512/512-maskable/180-apple)
- `frontend/src/` — çevrimdışı bandı + Randevularım'da buton devre dışı bırakma (küçük)
- `backend/Program.cs` — `sw.js` için `Cache-Control: no-cache` başlığı (tek satırlık middleware/statik dosya seçeneği)
- `scripts/` — manifest assert script'i
