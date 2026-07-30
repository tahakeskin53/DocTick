# Giriş → Ana Sayfa Süresi Optimizasyonu — Uygulama Planı

> **Durum: TAMAMLANDI** (2026-07-30) — 6 görevin altısı da uygulandı, canlıya alındı ve `doctick.me` üzerinde ölçüldü. Sonuçlar ve iki uyarı için Task 6 sonundaki **"Sonuç"** bölümüne bak.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Oturumu açık bir kullanıcının siteyi açmasıyla ana sayfanın dolu görünmesi arasındaki süreyi ~1.2 sn'den ~0.7 sn'ye indirmek.

**Architecture:** Sorun tek bir yavaş parça değil, tamamen **seri** bir şelale: 542 KB sıkıştırılmamış JS inip parse olmadan hiçbir API çağrısı başlamıyor, `/api/auth/me` bitmeden `/api/appointments` başlamıyor. Plan bu şelaleyi üç yerden kırıyor — (1) API çağrılarını `index.html`'e taşıyıp bundle indirmesiyle paralelleştirmek, (2) statik varlıkları sıkıştırıp önbelleklemek, (3) bekleme ekranını gerçek iskelete çevirerek algılanan süreyi kısaltmak. Ardından sunucu tarafındaki iki gizli maliyet temizleniyor: giriş isteğinin içindeki SMB dosya yazımı ve her API çağrısındaki fazladan yetki sorgusu.

**Tech Stack:** React 19 + Vite 8 + react-router 8 (data mode) + TanStack Query · ASP.NET Core 10 Minimal API + EF Core/SQLite · Azure App Service Linux B1 (westeurope) · xunit

**Ölçüm temeli (2026-07-29, canlı site):** yeni bağlantı ~440 ms · açık bağlantıda istek ~75 ms · `index-*.js` 542 KB **sıkıştırılmamış** · hash'li varlıklarda `Cache-Control` yok · HTTP/1.1.

---

## Ön koşullar

✅ **Tamamlandı (2026-07-29):** Önceki iş `6c1bd56 feat(admin): randevular sayfasi + Azure deploy kurulumu` olarak commit'lendi, `perf/login-to-home` dalı ondan açıldı. Plandaki tüm "mevcut kod" alıntıları bu commit'in içeriğine göre yazıldı.

Backend testlerinin şu an geçtiğini doğrula — bu plan mevcut testlerden birini (`AuthAuditTests`) kasıtlı olarak bozup düzeltecek, o yüzden başlangıç durumu net olmalı:

```bash
dotnet test backend.Tests/DocTick.Api.Tests.csproj
# Beklenen: Passed! - Failed: 0
```

---

## Dosya Haritası

| Dosya | Sorumluluk | Görev |
|---|---|---|
| `frontend/index.html` | Bundle inmeden auth + randevu isteklerini başlatan önyükleme scripti | 1 |
| `frontend/src/api/client.ts` | Önyüklenmiş `Response`'u tek seferlik tüketen `api()` parametresi | 1 |
| `frontend/src/api/boot.test.ts` | **Yeni** — `takeBoot` tek seferlik tüketim testi (`node` ile doğrudan) | 1 |
| `backend/Program.cs` | Yanıt sıkıştırma + hash'li varlıklara `immutable` cache; `UserGate` kaydı | 2, 5 |
| `frontend/src/components/display/LayoutSkeleton.tsx` | **Yeni** — hasta ve admin kabuğunun iskelet karşılıkları | 3 |
| `frontend/src/styles/styles.css` | İskelet nabız animasyonu (`@keyframes dt-pulse`) | 3 |
| `frontend/src/router.tsx` | `Splash` yerine role uygun iskeleti göster | 3 |
| `backend/Auth/AuthAudit.cs` | Dosya yazımını istek yolundan çıkar | 4 |
| `backend.Tests/UnitTest1.cs` | Asenkron audit yazımı + `UserGate` testleri | 4, 5 |
| `backend/Auth/UserGate.cs` | **Yeni** — kısa TTL'li kullanıcı yetki önbelleği | 5 |
| `backend/Auth/Authz.cs` | `ActiveGuard` artık `UserGate` kullanır | 5 |
| `backend/Endpoints/AdminEndpoints.cs` | Onay/red/silmede önbelleği geçersiz kıl | 5 |

**Kapsam dışı (bilinçli):** Kod bölme (`React.lazy`), hero videosunun yeniden encode'u, CDN, HTTP/2 açılması, SQLite'ın taşınması, son kullanıcıyı `localStorage`'a yazma. Bunlar ayrı işler; bu plan yalnız giriş→ana sayfa şelalesine odaklanıyor.

---

## Task 1: API çağrılarını bundle indirmesiyle paralelleştir

Şu an `AuthProvider`'ın `useEffect`'i ancak 542 KB JS indirilip parse edilip React mount olduktan **sonra** `/api/auth/me`'yi çağırıyor. `index.html`'e konan küçük bir klasik script bu iki isteği bundle daha inerken başlatır; `client.ts` hazır `Response`'u tek seferlik tüketir. İki round trip (~150 ms) indirme süresinin içine gizlenir.

`Response` nesnesini doğrudan taşımak, `api()` içindeki mevcut 401/403/JSON işleme mantığının **hiç değişmeden** geçerli kalmasını sağlar — bu yüzden ham JSON değil `Promise<Response>` saklıyoruz.

**Files:**
- Modify: `frontend/index.html:9-10`
- Modify: `frontend/src/api/client.ts:36-58` (`api()` imzası) ve `61-63` (`Api.me`, `Api.myAppointments`)

- [x] **Step 1: Önyükleme scriptini `index.html`'e ekle**

`frontend/index.html` içinde `<title>` satırından sonra, `</head>`'ten önce ekle:

```html
    <title>DocTick — Randevu</title>
    <script>
      // Bundle (~150 KB br) inerken auth + randevu isteklerini başlat.
      // React mount'unu beklersek bu iki round trip (~150 ms) şelalenin sonuna eklenirdi.
      // Promise'ler client.ts tarafından TEK SEFER tüketilir; tüketilmezse boşa 401 döner, zararsız.
      // ponytail: anonim ziyaretçi de bu iki isteği atar (2× 401). Hedef kitle giriş yapmış
      // kullanıcı olduğu için kabul; kaçınmak HttpOnly olmayan bir "oturum var" ipucu cookie'si gerektirir.
      (function () {
        var start = function (url) {
          var p = fetch(url, { credentials: 'include' });
          p.catch(function () {}); // tüketilmezse "unhandled rejection" uyarısı çıkmasın
          return p;
        };
        window.__boot = { me: start('/api/auth/me'), appts: start('/api/appointments') };
      })();
    </script>
  </head>
```

Script `type="module"` **değil** — modüller ertelenir (defer), klasik inline script ise anında çalışır. Vite'ın enjekte ettiği module script'ten önce çalışması bu yüzden garanti.

- [x] **Step 2a: `ApiError`'ı Node'un çalıştırabileceği hâle getir**

Projenin test deseni `.ts` dosyalarını Node ile **doğrudan** çalıştırıyor (tip-sıyırma modu). Bu mod TypeScript'in constructor parameter property kısayolunu desteklemiyor, dolayısıyla `client.ts`'i import eden hiçbir test çalışamaz:

```
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]: TypeScript parameter property is not supported in strip-only mode
```

`frontend/src/api/client.ts` içinde mevcut:

```ts
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
```

Şununla değiştir (davranış birebir aynı — `new ApiError(401, '…')` ve `e.status` değişmeden çalışır):

```ts
export class ApiError extends Error {
  status: number;
  // Not: `constructor(public status: ...)` kısayolu kullanılmıyor — Node'un tip-sıyırma modu
  // (test dosyaları .ts'i doğrudan çalıştırıyor) parameter property'yi desteklemiyor.
  constructor(status: number, message: string) { super(message); this.status = status; }
}
```

- [x] **Step 2: `api()` fonksiyonunu hazır `Response` kabul eder hâle getir**

`frontend/src/api/client.ts` içinde `api` fonksiyonunun ilk satırlarını değiştir. Mevcut:

```ts
async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  // ...opts önce; credentials/headers sonda — çağrıcı yanlışlıkla ezemez.
  const res = await fetch(path, {
    ...opts,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
```

Yeni:

```ts
// index.html'de başlatılan önyükleme isteğini tek seferlik devral (yoksa undefined).
// export: Response gövdesi bir kez okunabildiği için "tek seferlik" garantisi test edilir (boot.test.ts).
export function takeBoot(key: 'me' | 'appts'): Promise<Response> | undefined {
  const b = (window as unknown as { __boot?: Record<string, Promise<Response> | undefined> }).__boot;
  if (!b) return undefined;
  const p = b[key];
  b[key] = undefined; // Response gövdesi bir kez okunur — ikinci tüketimi engelle
  return p;
}

async function api<T>(path: string, opts: RequestInit = {}, pre?: Promise<Response>): Promise<T> {
  // ...opts önce; credentials/headers sonda — çağrıcı yanlışlıkla ezemez.
  // pre: index.html'de erken başlatılmış istek; geri kalan 401/403/JSON işleme aynen geçerli.
  const res = await (pre ?? fetch(path, {
    ...opts,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  }));
```

Fonksiyonun geri kalanı (401/403/`res.ok`/`204`/content-type kontrolleri) **değişmiyor**.

- [x] **Step 3: İki uç noktayı önyüklemeyi kullanacak şekilde bağla**

`frontend/src/api/client.ts` içinde `Api` nesnesinde iki satırı değiştir. Mevcut:

```ts
  me: () => api<Me>('/api/auth/me'),
```
```ts
  myAppointments: () => api<Appointment[]>('/api/appointments'),
```

Yeni:

```ts
  me: () => api<Me>('/api/auth/me', {}, takeBoot('me')),
```
```ts
  myAppointments: () => api<Appointment[]>('/api/appointments', {}, takeBoot('appts')),
```

İlk çağrı önyüklenmiş isteği devralır; sonraki çağrılar (`refresh()`, react-query refetch) `undefined` alıp normal `fetch` yapar. `Auth.tsx` ve `Home.tsx` **hiç değişmiyor**.

- [x] **Step 4: `takeBoot`'un tek seferlik olduğunu test et**

Projede yerleşik desen: framework yok, düz assert, Node doğrudan çalıştırır (bkz. `frontend/src/pages/admin/periodRange.test.ts`). Aynı deseni izleyerek `frontend/src/api/boot.test.ts` oluştur:

```ts
// Çalıştır: node src/api/boot.test.ts   (Node 24 .ts'i doğrudan çalıştırır)
// Bilerek import'suz assert — periodRange.test.ts ile aynı desen.
import { takeBoot } from './client.ts';

let fails = 0;
function eq(actual: unknown, expected: unknown, what: string) {
  if (actual === expected) return;
  fails++;
  console.error(`FAIL ${what}: beklenen ${String(expected)}, gelen ${String(actual)}`);
}

const g = globalThis as unknown as { window?: unknown; __boot?: unknown };
g.window = g; // client.ts window üzerinden okuyor; Node'da kendimizi window yap

// 1) __boot yoksa undefined döner (dev/SSR/eski önbellek senaryosu — çökmemeli)
eq(takeBoot('me'), undefined, '__boot yokken undefined');

// 2) İlk çağrı promise'i verir, İKİNCİ çağrı vermez.
//    Response gövdesi bir kez okunabilir; iki tüketici olursa "body already read" hatası çıkar.
const fake = Promise.resolve('yerine-gecen' as unknown as Response);
g.__boot = { me: fake, appts: undefined };
eq(takeBoot('me'), fake, 'ilk cagri promise doner');
eq(takeBoot('me'), undefined, 'ikinci cagri undefined doner');

// 3) Anahtarlar birbirinden bagimsiz
const a = Promise.resolve('appts' as unknown as Response);
g.__boot = { me: fake, appts: a };
eq(takeBoot('appts'), a, 'appts kendi promise ini doner');
eq(takeBoot('me'), fake, 'me hala tuketilebilir');

console.log(fails === 0 ? 'OK: takeBoot tek seferlik' : `${fails} test basarisiz`);
process.exit(fails === 0 ? 0 : 1);
```

Çalıştır:

```bash
cd frontend && node src/api/boot.test.ts
```

Beklenen: `OK: takeBoot tek seferlik`, çıkış kodu 0. `takeBoot` `export` edilmediyse import hatası verir — Step 2'deki `export` anahtar sözcüğünü unutma.

- [x] **Step 5: Derle ve önyüklemenin doğru yerde olduğunu doğrula**

```bash
cd frontend && npm run build
```

Beklenen: `tsc -b` hatasız, `dist/index.html` üretilir.

Sonra bu kontrolü çalıştır — önyükleme scripti build çıktısında **ve** module script'inden önce olmalı:

```bash
node -e "const h=require('fs').readFileSync('dist/index.html','utf8');const b=h.indexOf('__boot'),m=h.indexOf('type=\"module\"');if(b<0)throw new Error('FAIL: __boot dist/index.html icinde yok');if(m>=0&&b>m)throw new Error('FAIL: __boot module script SONRASINDA');console.log('OK: onyukleme scripti module scriptinden once, offset',b,'<',m)"
```

Beklenen: `OK: onyukleme scripti module scriptinden once, offset ... < ...`

- [x] **Step 6: Tarayıcıda şelaleyi doğrula**

```bash
# 1. terminal
dotnet run --project backend
# 2. terminal
cd frontend && npm run preview
```

`http://localhost:5173` → DevTools → Network → "Disable cache" **kapalı**, sayfayı yenile.

Beklenen: `auth/me` ve `appointments` istekleri, `index-*.js` isteğiyle **aynı anda** başlar (waterfall'da yan yana, art arda değil). Öncesinde `me` bundle'dan sonra başlıyordu.

- [x] **Step 7: Commit**

```bash
git add frontend/index.html frontend/src/api/client.ts frontend/src/api/boot.test.ts
git commit -m "perf: auth+randevu isteklerini bundle indirmesiyle paralelle"
```

---

## Task 2: Statik varlıkları sıkıştır ve önbelleğe al

542 KB JS şelalenin başında duruyor ve arkasındaki her şeyi bekletiyor. Linux App Service'te uygulama doğrudan Kestrel olarak çalışıyor (yanıtta `Server: Kestrel`), IIS'teki gibi otomatik gzip yapan bir ön uç yok — bu yüzden sıkıştırma uygulamada açılmalı.

**Kritik ayrıntı:** ASP.NET Core'un varsayılan MIME listesi `application/javascript` içerir ama .NET 10 statik dosya sunucusu `.js`'yi **`text/javascript`** olarak servis ediyor (canlı yanıtta doğrulandı). Bu tür açıkça eklenmezse sıkıştırma sessizce hiç çalışmaz.

JSON API yanıtları bilerek listeye alınmıyor: zaten küçükler ve HTTPS üzerinde kimlik doğrulamalı gövde sıkıştırmanın BREACH sınıfı riskinden uzak durulmuş olur.

**Files:**
- Modify: `backend/Program.cs:36-38` (servis kaydı), `41-52` (middleware + cache başlıkları)

- [x] **Step 1: Sıkıştırma servisini kaydet**

`backend/Program.cs` içinde `builder.Services.AddOpenApi();` satırından **önce** ekle:

```csharp
// --- Yanıt sıkıştırma ---
// Linux App Service'te uygulama doğrudan Kestrel; gzip yapan bir ön uç YOK — burada açılmazsa
// 542 KB JS ham gider. text/javascript ve image/svg+xml varsayılan listede yok, elle ekleniyor.
// JSON bilerek dışarıda: yanıtlar zaten küçük, HTTPS+cookie ile sıkıştırma riski gereksiz.
builder.Services.AddResponseCompression(o =>
{
    o.EnableForHttps = true; // varsayılan false; site tamamen HTTPS
    o.MimeTypes = new[] { "text/javascript", "text/css", "text/html", "image/svg+xml", "application/manifest+json" };
});
```

- [x] **Step 2: Middleware'i statik dosyalardan önce devreye al ve cache başlıklarını ekle**

`backend/Program.cs` içinde mevcut statik dosya bloğunu değiştir. Mevcut:

```csharp
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

Yeni:

```csharp
app.UseResponseCompression(); // UseStaticFiles'tan ÖNCE olmalı — sonra gelirse yanıt çoktan yazılmış olur
app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // SW, giriş HTML'i ve manifest asla önbelleklenmesin — PWA güncellemeleri gecikmesin.
        if (ctx.File.Name is "sw.js" or "index.html" or "manifest.webmanifest" or "registerSW.js")
            ctx.Context.Response.Headers.CacheControl = "no-cache";
        // /assets/* dosya adı içerik hash'i taşır (Vite) — içerik değişirse ad değişir.
        // Sonsuza dek önbelleklenebilir; aksi hâlde her ziyarette boşuna 304 turu atılıyordu.
        else if (ctx.Context.Request.Path.StartsWithSegments("/assets"))
            ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
    }
});
```

- [x] **Step 3: Derle**

```bash
dotnet build backend/DocTick.Api.csproj
```

Beklenen: `Build succeeded`, 0 hata.

- [x] **Step 4: Yerelde sıkıştırmayı ve cache başlığını doğrula**

SPA'nın `wwwroot`'ta olması gerekiyor (workflow'un yaptığının aynısı):

```bash
cd frontend && npm run build && cd ..
rm -rf backend/wwwroot && cp -r frontend/dist backend/wwwroot
dotnet run --project backend
```

Başka bir terminalde — JS dosyasının gerçek adını build çıktısından al:

```bash
JS=$(ls backend/wwwroot/assets/*.js | head -1 | xargs basename)
curl -sS -o /dev/null -D - -H "Accept-Encoding: br, gzip" "http://localhost:5080/assets/$JS" | grep -i "content-encoding\|content-length\|cache-control"
```

Beklenen (üçü de görünmeli):
```
Content-Encoding: br
Cache-Control: public, max-age=31536000, immutable
```
`Content-Length` ya yok (chunked) ya da ~150 KB civarı — **542642 olmamalı**. Hâlâ 542642 ve `Content-Encoding` yoksa, MIME türü listeyle eşleşmiyor demektir: `curl -I` ile `Content-Type`'ı kontrol et ve listeye o türü ekle.

- [x] **Step 5: `index.html`'in hâlâ `no-cache` olduğunu doğrula (regresyon kontrolü)**

```bash
curl -sS -o /dev/null -D - http://localhost:5080/ | grep -i "cache-control"
```

Beklenen: `Cache-Control: no-cache` — PWA güncellemelerinin takılmaması buna bağlı.

- [x] **Step 6: Commit**

```bash
git add backend/Program.cs
git commit -m "perf: brotli yanit sikistirma + /assets icin immutable cache"
```

---

## Task 3: Bekleme ekranını gerçek kabuk iskeletiyle değiştir

`router.tsx:18-24`'teki `Splash`, ekranın ortasında "DocTick yükleniyor…" yazan boş bir sayfa. Aynı sürede gerçek kabuğu (mavi header, logo, sekmeler, kart yerleri) göstermek algılanan süreyi belirgin şekilde kısaltır — ölçülen süre değişmez, kullanıcının hissi değişir.

Hasta ve admin düzenleri tamamen farklı (`HastaLayout` üstte header, `AdminLayout` solda sidebar), o yüzden tek bir "nötr" iskelet olmaz. Her guard kendinden sonra gelecek düzenin iskeletini gösterir.

**Files:**
- Create: `frontend/src/components/display/LayoutSkeleton.tsx`
- Modify: `frontend/src/styles/styles.css` (dosya sonuna ekleme)
- Modify: `frontend/src/router.tsx:18-24` (`Splash` kaldır), `29`, `40` (kullanım yerleri)

- [x] **Step 1: Nabız animasyonunu stillere ekle**

`frontend/src/styles/styles.css` dosyasının **sonuna** ekle:

```css
/* Yükleme iskeleti — statik gri bloklar "donmuş" hissi verir, hafif nabız beklemeyi canlı gösterir. */
@keyframes dt-pulse { 0%, 100% { opacity: .55; } 50% { opacity: .9; } }
.dt-skel { background: rgba(15, 23, 42, .07); border-radius: var(--radius-md); animation: dt-pulse 1.4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) { .dt-skel { animation: none; } }
```

- [x] **Step 2: İskelet bileşenlerini oluştur**

`frontend/src/components/display/LayoutSkeleton.tsx` dosyasını oluştur:

```tsx
import { Logo } from './Logo.jsx';

/**
 * /me yanıtı beklenirken gösterilir. Amaç ölçülen süreyi değil ALGILANAN süreyi kısaltmak:
 * kullanıcı boş bir "yükleniyor" yazısı yerine sayfanın gerçek çerçevesini görür.
 * Kabuk (header/sidebar) kullanıcı verisine bağlı değil, bu yüzden şimdiden çizilebilir.
 */

const block = (w: number | string, h: number, style: React.CSSProperties = {}) => (
  <div className="dt-skel" style={{ width: w, height: h, ...style }} />
);

/** HastaLayout'un iskeleti — üstte marka rengi header, altında kart yerleri. */
export function HastaSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-page)' }}>
      <header style={{ background: 'var(--surface-brand)', height: 58 }}>
        <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '0 var(--page-pad)', height: 58, display: 'flex', alignItems: 'center', gap: 24 }}>
          <Logo size={30} onDark />
        </div>
      </header>
      <main style={{ maxWidth: 'var(--page-max)', margin: '0 auto', padding: '26px var(--page-pad) 56px', display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
        {block(260, 34)}
        {block(420, 20, { maxWidth: '100%' })}
        {block('100%', 118, { marginTop: 6 })}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {block(0, 150, { flex: 1, minWidth: 220 })}
          {block(0, 150, { flex: 1, minWidth: 220 })}
          {block(0, 150, { flex: 1, minWidth: 220 })}
        </div>
      </main>
    </div>
  );
}

/** AdminLayout'un iskeleti — solda sabit sidebar, sağda içerik yerleri. */
export function AdminSkeleton() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-page)' }}>
      <aside style={{ width: 220, flex: 'none', background: 'var(--surface-brand)', padding: '20px 12px', minHeight: '100vh' }}>
        <div style={{ padding: '0 14px 6px' }}><Logo size={28} onDark wordSize={19} /></div>
      </aside>
      <main style={{ flex: 1, padding: '18px 28px 56px', maxWidth: 980, display: 'flex', flexDirection: 'column', gap: 'var(--stack-gap)' }}>
        {block(220, 30)}
        {block('100%', 110)}
        {block('100%', 220)}
      </main>
    </div>
  );
}
```

- [x] **Step 3: `router.tsx`'te `Splash`'i iskeletlerle değiştir**

`frontend/src/router.tsx` başındaki import'a ekle (mevcut import bloğunun sonuna):

```tsx
import { HastaSkeleton, AdminSkeleton } from './components/display/LayoutSkeleton';
```

`Splash` fonksiyonunu (18-24. satırlar) **tamamen sil**:

```tsx
function Splash() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', background: 'var(--surface-page)', color: 'var(--text-muted)', font: 'var(--text-body-md)' }}>
      DocTick yükleniyor…
    </div>
  );
}
```

`HastaGuard` içinde:
```tsx
  if (loading) return <Splash />;
```
şununla değiştir:
```tsx
  // ponytail: /'a gelen bir Admin kısa süre hasta kabuğunu görür sonra /admin'e döner.
  // Admin tek kişi ve pencere <100 ms; role göre tahmin yürütmek buna değmez.
  if (loading) return <HastaSkeleton />;
```

`AdminGuard` içinde:
```tsx
  if (loading) return <Splash />;
```
şununla değiştir:
```tsx
  if (loading) return <AdminSkeleton />;
```

- [x] **Step 4: Derle ve lint'le**

```bash
cd frontend && npm run build && npm run lint
```

Beklenen: `tsc -b` hatasız (kullanılmayan `Splash` kalırsa TypeScript/oxlint uyarır — kaldırıldığını bu doğrular), oxlint temiz.

- [x] **Step 5: Gözle doğrula**

```bash
cd frontend && npm run preview
```

DevTools → Network → Throttling: **Slow 4G** → `http://localhost:5173/` yenile.

Beklenen: Yükleme sırasında "DocTick yükleniyor…" yazısı yerine mavi header + logo + nabız atan gri kart blokları görünür; `/me` dönünce içerik yerine oturur, **düzen sıçraması olmaz** (header yüksekliği 58 px her iki durumda da aynı).

- [x] **Step 6: Commit**

```bash
git add frontend/src/components/display/LayoutSkeleton.tsx frontend/src/styles/styles.css frontend/src/router.tsx
git commit -m "perf: yukleme ekrani yerine gercek kabuk iskeleti"
```

---

## Task 4: Audit log yazımını giriş isteğinin dışına çıkar

`AuthEndpoints.cs`, başarılı girişte `AuthAudit.Write(ctx, "login_success", user.Email)` çağırıyor. Prod'da `AUTH_AUDIT_DIR=/home/LogFiles/auth` ve Azure App Service'te **`/home` SMB üzerinden bağlı ağ paylaşımıdır** — yani `Directory.CreateDirectory` + `File.AppendAllText` ağ üzerinden dosya I/O yapıyor, üstelik global kilit içinde, üstelik kullanıcı yanıtı beklerken.

**Tehlike:** `HttpContext`, yanıt tamamlandıktan sonra güvenle okunamaz. Bu yüzden JSON satırı **senkron** üretilir (bellek içi, ucuz), yalnızca dosya yazımı arka plana atılır.

Bu değişiklik mevcut `AuthAuditTests.Write_AppendsParsableJsonLine` testini bozar (test, `Write` döndüğünde dosyanın yazılmış olduğunu varsayıyor). Test, üretim koduna sırf test için bir kanca eklemek yerine sınırlı süre bekleyecek şekilde güncelleniyor.

**Files:**
- Modify: `backend/Auth/AuthAudit.cs`
- Modify: `backend.Tests/UnitTest1.cs` (`AuthAuditTests` sınıfı)

- [x] **Step 1: Testi yeni davranışa göre güncelle (önce test)**

`backend.Tests/UnitTest1.cs` içindeki `AuthAuditTests` sınıfını tamamen değiştir:

```csharp
public class AuthAuditTests
{
    // Dosya yazımı artık istek yolunda değil (arka plan) — satır hemen değil, kısa süre içinde görünür.
    static string? WaitForLine(string path, string marker, int timeoutMs = 5000)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();
        while (sw.ElapsedMilliseconds < timeoutMs)
        {
            if (File.Exists(path))
            {
                try
                {
                    var line = File.ReadLines(path).LastOrDefault(l => l.Contains(marker));
                    if (line is not null) return line;
                }
                catch (IOException) { /* eşzamanlı yazma sürüyor — tekrar dene */ }
            }
            Thread.Sleep(25);
        }
        return null;
    }

    // AuthAudit.Write bugünkü auth-*.log dosyasına geçerli JSON bir satır eklemeli.
    [Fact]
    public void Write_AppendsParsableJsonLine()
    {
        var ctx = new DefaultHttpContext();
        var marker = "test-" + Guid.NewGuid().ToString("N");
        AuthAudit.Write(ctx, marker, "a@b.c", "sebep-x");

        var path = Path.Combine(Directory.GetCurrentDirectory(), "logs", $"auth-{DateTime.UtcNow:yyyy-MM-dd}.log");
        var last = WaitForLine(path, marker);
        Assert.NotNull(last); // süre içinde yazılmadıysa arka plan yazımı bozuk
        using var doc = JsonDocument.Parse(last!); // parse edilemezse fırlatır → test kırılır
        Assert.Equal(marker, doc.RootElement.GetProperty("evt").GetString());
        Assert.Equal("a@b.c", doc.RootElement.GetProperty("email").GetString());
        Assert.Equal("sebep-x", doc.RootElement.GetProperty("reason").GetString());
    }
}
```

- [x] **Step 2: Testi çalıştır — hâlâ geçmeli**

```bash
dotnet test backend.Tests/DocTick.Api.Tests.csproj --filter "FullyQualifiedName~AuthAuditTests"
```

Beklenen: PASS. (Yazım hâlâ senkron olduğu için `WaitForLine` ilk denemede bulur. Bu adım, testin yeni hâlinin doğru olduğunu üretim kodunu değiştirmeden kanıtlar.)

- [x] **Step 3: `AuthAudit.Write`'i arka plana taşı**

`backend/Auth/AuthAudit.cs` dosyasını tamamen değiştir:

```csharp
using System.Text.Json;

namespace DocTick.Api.Auth;

// Auth olaylarını (login_success / token_invalid / config_error) kalıcı, grep'lenebilir
// bir JSONL dosyasına yazar: logs/auth-YYYY-MM-DD.log. Giriş hataları artık sessizce kaybolmaz.
public static class AuthAudit
{
    static readonly object _gate = new(); // ponytail: global lock, dev/düşük hacim için yeter; hacim artarsa kanal/kuyruk

    public static void Write(HttpContext ctx, string evt, string? email = null, string? reason = null)
    {
        // HttpContext yanıt tamamlandıktan sonra güvenle okunamaz — alanlar ŞİMDİ, senkron okunur.
        var line = JsonSerializer.Serialize(new
        {
            ts = DateTime.UtcNow.ToString("o"),
            evt,
            email,
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
                File.AppendAllText(Path.Combine(dir, $"auth-{DateTime.UtcNow:yyyy-MM-dd}.log"), line + "\n");
            }
        }
        catch (Exception ex)
        {
            // Arka plan görevinde yakalanmayan istisna süreci düşürebilir — audit yazımı uygulamayı öldürmemeli.
            Console.Error.WriteLine($"[AuthAudit] yazilamadi: {ex.Message}");
        }
    }
}
```

`Directory.GetCurrentDirectory()` çağrısının `Write` içinde (senkron tarafta) kalması önemli: arka plan görevi başladığında çalışma dizini değişmiş olabilir.

- [x] **Step 4: Tüm testleri çalıştır**

```bash
dotnet test backend.Tests/DocTick.Api.Tests.csproj
```

Beklenen: `Passed! - Failed: 0`. `Write_AppendsParsableJsonLine` artık arka plan yazımını bekleyerek geçiyor.

- [x] **Step 5: Commit**

```bash
git add backend/Auth/AuthAudit.cs backend.Tests/UnitTest1.cs
git commit -m "perf: audit log yazimini giris istegi yolundan cikar"
```

---

## Task 5: Yetki denetimindeki istek başına DB sorgusunu önbelleğe al

`backend/Auth/Authz.cs`'teki `ActiveGuard.Patient` / `.Admin`, **her** hasta/admin API çağrısında asıl sorgudan önce bir `Users` lookup'ı yapıyor. Yani `/api/appointments` aslında iki sorgu ve SQLite `/home`'da (SMB) olduğu için bu bedava değil.

Filtre kaldırılmayacak — dosyadaki `ponytail:` yorumundaki gerekçe gerçek: cookie'deki claim'ler 7 gün bayat kalıyor, admin reddettiğinde durumun anında yansıması gerekiyor. Çözüm, davranışı koruyup sorguyu kaldırmak: kısa TTL'li önbellek **artı** onay/red/silme uçlarında anında geçersiz kılma.

`/api/auth/me` bilerek önbelleğe alınmıyor — sayfa başına bir kez çağrılıyor ve oradaki "DB'den güncel durum" garantisi olduğu gibi korunuyor.

**Files:**
- Create: `backend/Auth/UserGate.cs`
- Modify: `backend/Auth/Authz.cs:25-45` (`ActiveGuard`)
- Modify: `backend/Program.cs` (servis kaydı)
- Modify: `backend/Endpoints/AdminEndpoints.cs:125-161` (approve / reject / delete)
- Test: `backend.Tests/UnitTest1.cs` (yeni `UserGateTests` sınıfı)

- [x] **Step 1: Başarısız testi yaz**

`backend.Tests/UnitTest1.cs` dosyasının **sonuna** ekle:

```csharp
public class UserGateTests
{
    static SqliteConnection OpenShared()
    {
        var c = new SqliteConnection("DataSource=:memory:");
        c.Open();
        return c;
    }

    static AppDb NewDb(SqliteConnection c)
    {
        var db = new AppDb(new DbContextOptionsBuilder<AppDb>().UseSqlite(c).Options);
        db.Database.EnsureCreated();
        return db;
    }

    // Önbellek gerçekten sorguyu atlamalı (bayat değer döner) ve Invalidate onu anında tazelemeli.
    [Fact]
    public async Task Caches_UntilInvalidated()
    {
        var conn = OpenShared();
        var seed = NewDb(conn);
        var u = new User { GoogleSub = "s1", Email = "a@b.c", Name = "Hasta", Status = UserStatus.Active };
        seed.Users.Add(u);
        await seed.SaveChangesAsync();
        var uid = u.Id;
        await seed.DisposeAsync();

        var cache = new MemoryCache(new MemoryCacheOptions());
        var gate = new UserGate(NewDb(conn), cache);

        Assert.Equal(UserStatus.Active, (await gate.GetAsync(uid))!.Status);

        // Durumu DB'de ayrı bir bağlamdan değiştir — önbellek bunu görmemeli.
        var other = NewDb(conn);
        (await other.Users.FirstAsync(x => x.Id == uid)).Status = UserStatus.Rejected;
        await other.SaveChangesAsync();
        await other.DisposeAsync();

        Assert.Equal(UserStatus.Active, (await gate.GetAsync(uid))!.Status); // bayat = önbellek çalışıyor

        gate.Invalidate(uid);

        // Invalidate sonrası taze okuma için yeni bir DbContext (aynı bağlantı, aynı veri).
        var fresh = new UserGate(NewDb(conn), cache);
        Assert.Equal(UserStatus.Rejected, (await fresh.GetAsync(uid))!.Status);
    }
}
```

Dosyanın başındaki using'lere ekle (yoksa):

```csharp
using Microsoft.Extensions.Caching.Memory;
```

- [x] **Step 2: Testi çalıştır, DERLENMEDİĞİNİ doğrula**

```bash
dotnet test backend.Tests/DocTick.Api.Tests.csproj --filter "FullyQualifiedName~UserGateTests"
```

Beklenen: FAIL — `error CS0246: The type or namespace name 'UserGate' could not be found`. `UserGate` henüz yok.

- [x] **Step 3: `UserGate`'i yaz**

`backend/Auth/UserGate.cs` dosyasını oluştur:

```csharp
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using DocTick.Api.Models;

namespace DocTick.Api.Auth;

// Yetki denetimi (ActiveGuard) her API çağrısında kullanıcıyı DB'den okuyordu; SQLite prod'da
// Azure Files (SMB) üzerinde olduğu için bu istek başına ekstra ağ turu demekti.
// Kısa TTL + onay/red/silmede anında invalidasyon: yetki değişikliği yine anında yansır,
// istek başına sorgu gider.
public sealed class UserGate(AppDb db, IMemoryCache cache)
{
    // ponytail: 15 sn üst sınır. Invalidate çağrılmayan bir yol kalırsa bayatlık en fazla bu kadar sürer.
    static readonly TimeSpan Ttl = TimeSpan.FromSeconds(15);

    static string Key(int uid) => $"user-gate:{uid}";

    public async Task<User?> GetAsync(int uid, CancellationToken ct = default)
    {
        if (cache.TryGetValue(Key(uid), out User? hit)) return hit;
        var u = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == uid, ct);
        cache.Set(Key(uid), u, Ttl); // null da önbelleklenir — silinmiş kullanıcı için tur atmayalım
        return u;
    }

    public void Invalidate(int uid) => cache.Remove(Key(uid));
}
```

- [x] **Step 4: Testi çalıştır, GEÇTİĞİNİ doğrula**

```bash
dotnet test backend.Tests/DocTick.Api.Tests.csproj --filter "FullyQualifiedName~UserGateTests"
```

Beklenen: PASS.

- [x] **Step 5: `ActiveGuard`'ı `UserGate` kullanacak şekilde değiştir**

`backend/Auth/Authz.cs` içindeki `ActiveGuard` sınıfının gövdesini değiştir. Mevcut iki metodun ilk iki satırı:

```csharp
        var db = ctx.HttpContext.RequestServices.GetRequiredService<AppDb>();
        var u = await db.Users.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == CurrentUser.Uid(ctx.HttpContext.User), ctx.HttpContext.RequestAborted);
```

Her iki metotta da bunu şununla değiştir:

```csharp
        var gate = ctx.HttpContext.RequestServices.GetRequiredService<UserGate>();
        var u = await gate.GetAsync(CurrentUser.Uid(ctx.HttpContext.User), ctx.HttpContext.RequestAborted);
```

Metotların geri kalanı (`if (u is null || u.Status != ...) return Results.Forbid();` ve `return await next(ctx);`) aynen kalır. `Microsoft.EntityFrameworkCore` using'i dosyada başka kullanılmıyorsa oxlint/derleyici uyarır; uyarı gelirse kaldır.

- [x] **Step 6: Servisleri kaydet**

`backend/Program.cs` içinde `builder.Services.AddAuthorization();` satırından **sonra** ekle:

```csharp
// Yetki denetimi önbelleği — ActiveGuard'ın istek başına DB turunu kaldırır (bkz. UserGate).
builder.Services.AddMemoryCache();
builder.Services.AddScoped<UserGate>();
```

`Program.cs` başındaki using'lere ekle:

```csharp
using DocTick.Api.Auth;
```

- [x] **Step 7: Onay/red/silme uçlarında önbelleği geçersiz kıl**

`backend/Endpoints/AdminEndpoints.cs` içinde üç ucu değiştir.

**approve** (125. satır) — imzaya `UserGate gate` ekle ve `SaveChangesAsync`'ten sonra invalidate et:

```csharp
        grp.MapPost("/users/{id}/approve", async (int id, AppDb db, EmailService email, UserGate gate, CancellationToken ct) =>
        {
            var u = await db.Users.FindAsync([id], ct);
            if (u is null) return Results.NotFound();
            u.Status = UserStatus.Active;
            await db.SaveChangesAsync(ct);
            gate.Invalidate(id); // yetki önbelleği bayat kalmasın — onay anında geçerli olmalı
```

**reject** (137. satır) — aynı şekilde:

```csharp
        grp.MapPost("/users/{id}/reject", async (int id, AppDb db, EmailService email, UserGate gate, CancellationToken ct) =>
        {
            var u = await db.Users.FindAsync([id], ct);
            if (u is null) return Results.NotFound();
            u.Status = UserStatus.Rejected;
            await db.SaveChangesAsync(ct);
            gate.Invalidate(id); // reddedilen kullanıcı bir sonraki istekte 403 almalı
```

**delete** (149. satır) — imzaya ekle ve `SaveChangesAsync`'ten sonra invalidate et:

```csharp
        grp.MapDelete("/users/{id}", async (int id, AppDb db, ClaimsPrincipal me, UserGate gate, CancellationToken ct) =>
```

```csharp
            await db.SaveChangesAsync(ct);
            gate.Invalidate(id); // silinen kullanıcının önbellekteki kaydı kalmasın
            return Results.NoContent();
```

Dosyanın başında `using DocTick.Api.Auth;` zaten var (`CurrentUser` kullanılıyor), ek using gerekmez.

- [x] **Step 8: Derle ve tüm testleri çalıştır**

```bash
dotnet build backend/DocTick.Api.csproj && dotnet test backend.Tests/DocTick.Api.Tests.csproj
```

Beklenen: `Build succeeded` ve `Passed! - Failed: 0`.

- [x] **Step 9: Onay akışını elle doğrula (davranış regresyonu kontrolü)**

Bu, planın bozabileceği tek gerçek davranış. `dotnet run --project backend` ile ayağa kaldır, iki tarayıcı profiliyle:

1. Yeni bir Google hesabıyla giriş yap → `Pending` → `/onay-bekliyor` ekranı.
2. Admin hesabıyla `/admin/kullanicilar` → kullanıcıyı **Onayla**.
3. Hasta sekmesinde sayfayı yenile.

Beklenen: Kullanıcı **anında** ana sayfaya girer (15 sn beklemeden). Girmiyorsa `gate.Invalidate` çağrısı eksik veya yanlış id ile çağrılmış demektir.

- [x] **Step 10: Commit**

```bash
git add backend/Auth/UserGate.cs backend/Auth/Authz.cs backend/Program.cs backend/Endpoints/AdminEndpoints.cs backend.Tests/UnitTest1.cs
git commit -m "perf: yetki denetimine kisa omurlu onbellek + anlik invalidasyon"
```

---

## Task 6: Uçtan uca ölç ve doğrula

- [x] **Step 1: Deploy öncesi son kontrol**

```bash
cd frontend && npm run build && npm run lint && cd ..
rm -rf backend/wwwroot && cp -r frontend/dist backend/wwwroot
dotnet build backend/DocTick.Api.csproj
dotnet test backend.Tests/DocTick.Api.Tests.csproj
```

Beklenen: dördü de hatasız, `Failed: 0`.

- [x] **Step 2: Deploy**

```bash
git push -u origin perf/login-to-home
```

Deploy `main`'e push ile tetikleniyor (`.github/workflows/azure-deploy.yml`). PR açıp merge et, ardından Actions sekmesinden "Deploy to Azure" işinin yeşil bittiğini gör.

- [x] **Step 3: Canlıda sıkıştırma ve cache'i doğrula**

```bash
JS=$(curl -sS https://doctick.azurewebsites.net/ | grep -o '/assets/index-[^"]*\.js')
curl -sS -o /dev/null -D - -H "Accept-Encoding: br, gzip" "https://doctick.azurewebsites.net$JS" | grep -i "content-encoding\|content-length\|cache-control"
```

Beklenen: `Content-Encoding: br` **ve** `Cache-Control: public, max-age=31536000, immutable`. Boyut 542642 değil, ~150 KB civarı.

- [x] **Step 4: Şelaleyi ölç**

Gerçek bir oturumla (giriş yapılmış tarayıcıda) `https://doctick.azurewebsites.net/` → DevTools → Network → "Disable cache" **kapalı** → yenile.

Kontrol listesi:
- `auth/me` ve `appointments` `index-*.js` ile **aynı anda** başlıyor (arkasından değil).
- `index-*.js` transfer boyutu ~150 KB.
- Yükleme sırasında iskelet görünüyor, "DocTick yükleniyor…" yazısı yok.
- İkinci yenilemede `/assets/*` istekleri "(disk cache)" diyor, 304 turu atmıyor.

Hedef: DOMContentLoaded → ana sayfa dolu arası **~0.7 sn** (öncesi ~1.2 sn).

- [x] **Step 5: Sonucu memkraft'a yaz**

```bash
PYTHONUTF8=1 .venv/Scripts/python.exe -c "from memkraft import MemKraft; mk=MemKraft(base_dir='memory'); mk.log_event('giris->ana sayfa optimizasyonu uygulandi: onyukleme fetch, brotli+immutable cache, iskelet, async audit, UserGate onbellek', tags='performance,deploy', importance='high'); mk.update('DocTick','Giris sonrasi ana sayfa suresi ~1.2sn -> ~0.7sn; statik varliklar brotli + immutable cache ile servis ediliyor', source='perf')"
```

### Sonuç (ölçüm: 2026-07-30, canlı `doctick.me`, Chrome, oturumu açık hesap)

**Plandan sapan iki nokta:**

- **Step 2 — deploy `main`'e push ile değil, elle zip-deploy (OneDeploy) ile yapıldı**, doğrudan `perf/login-to-home` dalından. `main` hâlâ `75134e0` (27 Tem) ve `.github/workflows/azure-deploy.yml` orada yok, yani Actions hattı hiç çalışmadı. Yayındaki paket: `DocTick.Api.dll` mtime `2026-07-30T07:26:24Z`, frontend varlıklarıyla aynı deploy.
- **Step 3–4 `doctick.azurewebsites.net` üzerinde değil `doctick.me` üzerinde doğrulandı** — default hostname `AllowedHosts` ile pasife çekildiği için artık 400 dönüyor.

**A. Geri dönen kullanıcı (service worker precache sıcak), 3 tur:**

| Tur | Bundle | `/api/auth/me` | `/api/appointments` | DCL | Kritik yol |
|---|---|---|---|---|---|
| 1 | 24 ms (cache) | 37 → 155 | **37** → 422 | 55 | 422 ms |
| 2 | 10 ms (cache) | 22 → 187 | **22** → 162 | 47 | 187 ms |
| 3 | 9 ms (cache) | 25 → 182 | **25** → 182 | 49 | 182 ms |

Medyan **~187 ms**. 1. turdaki 422 ms aykırı değer — ilk isteğin `UserGate` önbelleğini doldurması.

**B. Task 1 doğrulandı:** her turda `auth/me` ve `appointments` **aynı ms'de** başlıyor (22–37 ms), bundle parse ve React mount'tan önce. Seri şelale kırılmış.

**C. Ağ maliyetleri (`cache: 'reload'`, 3'er tur medyan):**

| Kaynak | Süre | Boyut | Başlıklar |
|---|---|---|---|
| `index.html` | 240 ms | 1.561 B | `br` · `no-cache` ✅ (Step 5 regresyon kontrolü geçti) |
| `index-*.js` | 254 ms | 548.785 B → **223.528 B** tel üstünde | `br` · `max-age=31536000, immutable` ✅ |
| `/api/auth/me` | 101 ms | 106 B | — |
| `/api/appointments` | 112 ms | 2 B | — |

Soğuk yol ≈ HTML (240) + max(bundle 254, API 112) + parse ≈ **~575 ms** — modelleme, ölçüm değil.

**Hedefe göre:** geri dönen kullanıcı ~187 ms, soğuk ~575 ms — ikisi de `~0.7 sn` hedefinin altında.

> ⚠️ **Bu gerçek bir A/B değil.** Plandaki `~1.2 sn` başlangıç değeri yeniden ölçülemez; eski build artık yayında değil. Doğrulanan şey "bugünkü hal hedefin altında", "1.2 → 0.7 iyileşmesi kanıtlandı" değil. Kesin öncesi/sonrası isteniyorsa `6c1bd56` geçici olarak deploy edilmeli.
>
> Ayrıca varyans yüksek: aynı `index.html` üç ölçümde 99 / 240 / 432 ms geldi. Tek sayılar değil medyanlar anlamlı.

---

## Öz-değerlendirme notları

**Kapsam:** Önerilen sıranın beş maddesi de karşılandı — Task 1 (erken fetch), Task 2 (brotli; immutable cache aynı `Program.cs` bloğuna dokunduğu için buraya katıldı), Task 3 (iskelet), Task 4 (audit), Task 5 (yetki önbelleği).

**Bilinçli dışarıda bırakılanlar:** Kod bölme, video encode, CDN, HTTP/2, SQLite taşıma, `localStorage`'a son kullanıcı yazma. Her biri ayrı iş; bu plan tek bir şelaleyi düzeltiyor.

**Bu planın bozabileceği tek davranış** admin onay/red akışının anındalığı — Task 5 Step 9 bunu açıkça test ediyor.

**Frontend testleri projenin mevcut desenini izliyor:** framework yok, düz assert, Node dosyayı doğrudan çalıştırıyor (`frontend/src/pages/admin/periodRange.test.ts` bu deseni kuruyor). Task 1 saf mantık içerdiği için gerçek bir test alıyor (`boot.test.ts` — "tek seferlik tüketim" garantisi). Task 2 ve 3'te saf mantık yok (biri HTTP başlığı, diğeri görsel kabuk), o yüzden çalıştırılabilir kontrolleri `curl` ve derleme/lint biçiminde: `npm run build` + `npm run lint` + Task 2'deki başlık `curl`'leri.
