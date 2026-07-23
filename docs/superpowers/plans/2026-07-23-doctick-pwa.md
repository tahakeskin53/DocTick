# DocTick PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DocTick SPA'sını telefona "Ana ekrana ekle" ile kurulabilen, çevrimdışıyken kabuğu açılan ve Randevularım'ı son bilinen haliyle gösteren bir PWA yapmak.

**Architecture:** `vite-plugin-pwa` (Workbox) manifest'i enjekte eder, build çıktılarını precache'ler ve `autoUpdate` ile SW güncellemesini yönetir. Tek runtime kuralı: `GET /api/appointments` → NetworkFirst. Backend'e statik dosya servisi + SPA fallback + `sw.js` no-cache başlığı eklenir (üretim tek-origin yolu).

**Tech Stack:** Vite 8 + React 19 + TS, `vite-plugin-pwa` (yeni dev-dependency), `@vite-pwa/assets-generator` (npx, tek seferlik), .NET 10 Minimal API.

**Spec:** `docs/superpowers/specs/2026-07-23-doctick-pwa-design.md`

**Çalışma dizini notu:** Aksi yazılmadıkça komutlar repo kökünden (PowerShell). Frontend komutları `frontend/` içinden.

---

### Task 1: PWA ikonlarını üret

**Files:**
- Create: `frontend/public/pwa-64x64.png`, `frontend/public/pwa-192x192.png`, `frontend/public/pwa-512x512.png`, `frontend/public/maskable-icon-512x512.png`, `frontend/public/apple-touch-icon-180x180.png`, `frontend/public/favicon.ico`

- [ ] **Step 1: Üreticiyi çalıştır** (kaynak: mevcut `logo-icon.svg`)

```powershell
cd frontend
npx @vite-pwa/assets-generator --preset minimal-2023 public/logo-icon.svg
```

Expected: `public/` içine yukarıdaki 6 dosya üretilir (çıktıda her dosya listelenir).

- [ ] **Step 2: Dosyaları doğrula**

```powershell
Get-ChildItem public -Filter *.png | Select-Object Name,Length
```

Expected: 5 PNG listelenir, hepsi > 0 byte. PNG'leri aç ve göz kontrolü yap: `maskable-icon-512x512.png`'de logo, kenarlardan taşmayan güvenli alanda olmalı (maskable kenar payı üreticinin varsayılanı, beyaz zemin kabul).

- [ ] **Step 3: Commit**

```powershell
git add frontend/public/*.png frontend/public/favicon.ico
git commit -m "feat: PWA ikon seti (192/512/maskable/apple-touch)"
```

---

### Task 2: Manifest doğrulama script'i — önce kırmızı (ponytail çalışır-kontrolü)

**Files:**
- Create: `scripts/check_pwa.mjs`

- [ ] **Step 1: Script'i yaz**

```js
// scripts/check_pwa.mjs — build sonrası dist/ PWA çıktısını doğrular.
// Kullanım: node scripts/check_pwa.mjs   (önce: cd frontend && npm run build)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../frontend/dist/', import.meta.url));
let fails = 0;
const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); fails++; } };

assert(existsSync(dist + 'sw.js'), 'dist/sw.js uretilmis olmali');
assert(existsSync(dist + 'manifest.webmanifest'), 'dist/manifest.webmanifest uretilmis olmali');

if (existsSync(dist + 'manifest.webmanifest')) {
  const m = JSON.parse(readFileSync(dist + 'manifest.webmanifest', 'utf8'));
  // PWABuilder dogrulama kurallari (docs.pwabuilder.com):
  assert((m.name ?? '').length >= 2, 'name en az 2 karakter');
  assert((m.short_name ?? '').length >= 3, 'short_name en az 3 karakter (paketleme sarti)');
  assert(m.display === 'standalone', "display 'standalone'");
  assert(m.start_url === '/', "start_url '/'");
  assert((m.icons ?? []).some(i => i.sizes === '512x512' && (!i.purpose || i.purpose === 'any')), '512x512 purpose:any ikon var');
  assert((m.icons ?? []).some(i => i.purpose === 'maskable'), 'maskable ikon AYRI girdi olarak var');
  for (const i of m.icons ?? []) assert(existsSync(dist + i.src), `ikon dosyasi dist icinde: ${i.src}`);
  const html = readFileSync(dist + 'index.html', 'utf8');
  assert(html.includes('manifest.webmanifest'), 'index.html manifest linki iceriyor');
}

if (fails) { console.error(`${fails} kontrol basarisiz`); process.exit(1); }
console.log('PWA kontrolu OK');
```

- [ ] **Step 2: Kırmızı olduğunu gör** (henüz eklenti yok → sw.js/manifest üretilmiyor)

```powershell
cd frontend; npm run build; cd ..
node scripts/check_pwa.mjs
```

Expected: `FAIL: dist/sw.js uretilmis olmali`, `FAIL: dist/manifest.webmanifest uretilmis olmali` ve exit code 1.

- [ ] **Step 3: Commit**

```powershell
git add scripts/check_pwa.mjs
git commit -m "test: PWA manifest/SW dogrulama scripti (once kirmizi)"
```

---

### Task 3: vite-plugin-pwa — manifest + service worker

**Files:**
- Modify: `frontend/vite.config.ts` (tam içerik aşağıda)
- Modify: `frontend/index.html:5-7`
- Modify: `frontend/package.json` (yeni devDependency)

- [ ] **Step 1: Eklentiyi kur**

```powershell
cd frontend
npm i -D vite-plugin-pwa
```

Expected: hatasız kurulum. Peer-dependency uyumsuzluğu çıkarsa (Vite 8 desteği için) `npm view vite-plugin-pwa versions` ile Vite 8 destekleyen en yeni sürümü seçip `npm i -D vite-plugin-pwa@<sürüm>` kur — `--legacy-peer-deps` kullanma, gerçek uyumlu sürümü bul.

- [ ] **Step 2: `vite.config.ts`'i tümüyle şu içerikle değiştir**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Geliştirmede /api → backend (localhost:5080). Aynı köken gibi çalışır, cookie sorunsuz.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.svg', 'logo-icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'DocTick',
        short_name: 'DocTick',
        description: 'Hastane online randevu sistemi',
        lang: 'tr',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        id: '/',
        display: 'standalone',
        theme_color: '#164478',       // --blue-700 (--surface-brand)
        background_color: '#F7F9FB',  // --paper (--surface-page)
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          // PWABuilder kuralı: maskable AYRI girdi, 'any maskable' çifti yasak.
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Randevu Al', url: '/randevu-al', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
          { name: 'Randevularım', url: '/randevularim', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        ],
      },
      workbox: {
        // SPA navigasyonları offline'da index.html'e düşer; /api asla HTML'e düşmesin.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Yalnız Randevularım listesi (GET): önce ağ, ağ yoksa son önbellek.
            // Workbox route'ları varsayılan olarak yalnız GET ile eşleşir — POST /api/appointments önbelleklenmez.
            urlPattern: ({ url }) => url.pathname === '/api/appointments',
            handler: 'NetworkFirst',
            options: { cacheName: 'appointments', networkTimeoutSeconds: 3 },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true, // 5173 doluysa 5174'e kayma — hata ver. Google OAuth origin'i sadece 5173.
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
  // SW üretim davranışı `npm run preview` ile test edilir; 5173 = OAuth origin'i, proxy = cookie akışı.
  preview: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: `index.html` head'ine iki satır ekle** (mevcut `<link rel="icon" ...>` satırının altına)

```html
    <meta name="theme-color" content="#164478" />
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
```

- [ ] **Step 4: Build + kontrol script'i — yeşil**

```powershell
npm run build
cd ..
node scripts/check_pwa.mjs
```

Expected: build çıktısında `dist/sw.js` ve `dist/manifest.webmanifest` üretildiği görülür; script `PWA kontrolu OK` basar, exit code 0.

- [ ] **Step 5: Commit**

```powershell
git add frontend/vite.config.ts frontend/index.html frontend/package.json frontend/package-lock.json
git commit -m "feat: vite-plugin-pwa — manifest, autoUpdate SW, Randevularim NetworkFirst"
```

---

### Task 4: Çevrimdışı UX — banner + işlem butonlarını kilitle

**Files:**
- Create: `frontend/src/lib/useOnline.ts`
- Create: `frontend/src/components/OfflineBanner.tsx`
- Modify: `frontend/src/main.tsx:21-23`
- Modify: `frontend/src/pages/hasta/Appointments.tsx` (satırlar aşağıda)

- [ ] **Step 1: `useOnline` hook'unu yaz** — `frontend/src/lib/useOnline.ts`

```ts
import { useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
```

- [ ] **Step 2: Banner bileşenini yaz** — `frontend/src/components/OfflineBanner.tsx` (proje idiomu: inline style + tasarım tokenları)

```tsx
import { useOnline } from '../lib/useOnline';

export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div role="status" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, textAlign: 'center',
      padding: '8px 16px', background: 'var(--status-pending-bg)', color: 'var(--status-pending)',
      font: 'var(--text-body-sm)', borderBottom: '1px solid var(--border-default)',
    }}>
      Çevrimdışısınız — gösterilen veriler son bilinen durumdur.
    </div>
  );
}
```

- [ ] **Step 3: `main.tsx`'e bağla** — banner'ı `SmoothScroll` DIŞINDA tut (Lenis transform'u `position: fixed`'i bozar). Mevcut:

```tsx
          <AuthProvider>
            <SmoothScroll>
              <RouterProvider router={router} />
            </SmoothScroll>
          </AuthProvider>
```

Yenisi (import listesine `import { OfflineBanner } from './components/OfflineBanner';` eklenir):

```tsx
          <AuthProvider>
            <OfflineBanner />
            <SmoothScroll>
              <RouterProvider router={router} />
            </SmoothScroll>
          </AuthProvider>
```

(`AuthProvider` children'ı zaten ReactNode — birden çok çocuk sorun değil; değilse `<>...</>` fragment'ına sar.)

- [ ] **Step 4: `Appointments.tsx`'te çevrimdışıyken butonları kilitle** — 3 değişiklik:

(a) İmport + hook (satır 10 civarı, mevcut import'ların altına; fonksiyon gövdesinin başına):

```tsx
import { useOnline } from '../../lib/useOnline';
// ...
export function Appointments() {
  const online = useOnline();
```

(b) Satır 45-48'deki satır içi butonlara `disabled={!online}`:

```tsx
      {a.status === 'confirmed' && <Button variant="danger" size="sm" disabled={!online} onClick={() => setAsk(a)}>İptal et</Button>}
      {a.status === 'done' && (a.rating
        ? <Rating value={a.rating} readOnly size={15} />
        : <Button variant="secondary" size="sm" disabled={!online} onClick={() => { setRate(a); setStars(0); }}>Değerlendir</Button>)}
```

(c) Dialog onay butonları (satır 68 ve 76) — `disabled` koşullarına `|| !online` ekle:

```tsx
          <Button variant="danger" disabled={cancel.isPending || !online} onClick={() => { if (ask) { cancel.mutate(ask.id); setAsk(null); } }}>İptal et</Button>
```

```tsx
          <Button disabled={!stars || rateM.isPending || !online} onClick={() => { if (rate) { rateM.mutate({ id: rate.id, s: stars }); setRate(null); } }}>Gönder</Button>
```

- [ ] **Step 5: Derleme + lint kontrolü**

```powershell
cd frontend
npm run build
npm run lint
cd ..
```

Expected: her ikisi de hatasız (`tsc -b` tip kontrolünü içerir).

- [ ] **Step 6: Elle doğrula** (davranış SW'siz de test edilir)

```powershell
cd frontend; npm run dev
```

Tarayıcıda `http://localhost:5173/randevularim` → DevTools → Network → "Offline" seç → banner çıkmalı, "İptal et"/"Değerlendir" butonları devre dışı olmalı; "Online"a dönünce banner kaybolmalı, butonlar açılmalı.

- [ ] **Step 7: Commit**

```powershell
git add frontend/src/lib/useOnline.ts frontend/src/components/OfflineBanner.tsx frontend/src/main.tsx frontend/src/pages/hasta/Appointments.tsx
git commit -m "feat: cevrimdisi banner + Randevularim islem butonlari offline kilidi"
```

---

### Task 5: Backend — statik servis, SPA fallback, sw.js no-cache

**Files:**
- Modify: `backend/Program.cs:39-56`
- Modify: `.gitignore` (gerekirse)

- [ ] **Step 1: `Program.cs`'e statik servis ekle** — `var app = builder.Build();` (satır 39) ile `app.UseAuthentication();` (satır 41) arasına:

```csharp
// --- SPA statik servis (üretim: frontend/dist → wwwroot; dev'de Vite 5173 kullanılır) ---
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // SW, giriş HTML'i ve manifest asla önbelleklenmesin — PWA güncellemeleri gecikmesin.
        if (ctx.File.Name is "sw.js" or "index.html" or "manifest.webmanifest" or "registerSW.js")
            ctx.Context.Response.Headers.CacheControl = "no-cache";
    }
});
```

- [ ] **Step 2: SPA fallback ekle** — `app.MapGet("/", ...)` satırının (56) hemen ALTINA:

```csharp
// SPA derin linkleri (ör. /randevularim) index.html'e düşer. wwwroot boşken (dev) devreye girmez.
if (File.Exists(Path.Combine(app.Environment.WebRootPath ?? "wwwroot", "index.html")))
    app.MapFallbackToFile("index.html");
```

Not: mevcut `app.MapGet("/", ...)` kalsın — `wwwroot/index.html` varken `UseDefaultFiles` onu gölgeler, yokken API sağlık mesajı görünmeye devam eder.

- [ ] **Step 3: `wwwroot`'un gitignore'da olduğunu garanti et**

```powershell
Select-String -Path .gitignore -Pattern "wwwroot" -Quiet
```

`False` dönerse `.gitignore` sonuna şu satırı ekle: `backend/wwwroot/`

- [ ] **Step 4: Derle + testler**

```powershell
dotnet build backend/DocTick.Api.csproj
dotnet test backend.Tests/DocTick.Api.Tests.csproj
```

Expected: build hatasız; mevcut 7 test geçer.

- [ ] **Step 5: Üretim yolunu uçtan uca doğrula**

```powershell
Copy-Item -Recurse -Force frontend/dist/* backend/wwwroot/
cd backend; dotnet run --urls http://localhost:5080
```

İkinci terminalde:

```powershell
curl.exe -sI http://localhost:5080/sw.js | Select-String -Pattern "cache-control|content-type"
curl.exe -sI http://localhost:5080/randevularim | Select-String -Pattern "HTTP|content-type"
```

Expected: `sw.js` yanıtında `Cache-Control: no-cache`; `/randevularim` → `200` + `text/html` (SPA fallback çalışıyor).

- [ ] **Step 6: Commit**

```powershell
git add backend/Program.cs .gitignore
git commit -m "feat: backend statik servis + SPA fallback + sw.js no-cache"
```

---

### Task 6: Uçtan uca PWA doğrulaması (manuel kontrol listesi)

**Files:** yok (yalnızca doğrulama)

- [ ] **Step 1: Preview'da tam akış** — backend 5080'de çalışırken:

```powershell
cd frontend
npm run build
npm run preview
```

`http://localhost:5173` (preview, proxy'li) → Google ile giriş → randevu al → Randevularım'ı aç (liste önbelleğe girer).

- [ ] **Step 2: Kurulabilirlik** — Chrome/Edge DevTools → **Application → Manifest**: hata/uyarı olmamalı; adres çubuğundaki **"Uygulamayı yükle"** simgesiyle kur → uygulama kendi penceresinde, standalone açılmalı. (Lighthouse v12+ PWA kategorisini kaldırdı; güncel doğrulama yolu bu panel.)

- [ ] **Step 3: Çevrimdışı senaryo** — DevTools → Network → "Offline":
  - Uygulamayı yenile → kabuk açılır (beyaz ölüm ekranı yok).
  - `/randevularim` → son bilinen liste + sarı banner görünür; İptal/Değerlendir devre dışı.
  - `/randevu-al` → çevrimdışı davranış kibar (banner + istekler hata durumunda).
  - "Online"a dön → banner kaybolur, veri tazelenir.

- [ ] **Step 4 (opsiyonel — gerçek cihaz):** Android telefon USB ile bağlı, `chrome://inspect` → Port forwarding: `5173 → localhost:5173` → telefonda Chrome `http://localhost:5173` → menü → "Ana ekrana ekle" → kurulu uygulamadan giriş + randevu akışı + uçak modu testi. Çentikli ekranda üst/alt kenarları kontrol et: içerik çentiğin/gesture bar'ın altında kalıyorsa ilgili layout kapsayıcısına `padding: env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` ekle (spec §7 — yalnızca gerekirse).

- [ ] **Step 5: Son kontrol + memkraft kaydı**

```powershell
node scripts/check_pwa.mjs
```

Expected: `PWA kontrolu OK`. Ardından (proje kuralı, CLAUDE.md): `mk.log_event` ("PWA implementasyonu tamamlandı") + `mk.update("DocTick", "kurulabilir PWA eklendi: vite-plugin-pwa, offline Randevularim, backend statik servis")`.

---

## Kapsam dışı hatırlatması

Web Push, background sync ve mağaza paketleri bu planda yok. Uygulama halka açık bir HTTPS adrese deploy edilirse mağaza yolu spec §9'da: pwabuilder.com'a URL ver → scorecard → paket (Play: TWA + `assetlinks.json`; MS Store: MSIX + Partner Center ID'leri; iOS: ayrıca OAuth-webview riski değerlendirilmeli).
