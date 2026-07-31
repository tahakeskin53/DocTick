# Doktor Fotoğraflarını Sunucuya Taşı — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` ile görev görev uygula. Adımlar checkbox (`- [ ]`) ile takip edilir. Bu plan **yalnız doktor fotoğraflarıyla** ilgilidir; e-posta işi ayrı planda (`2026-07-30-eposta-gercek-aliciya.md`) ve **başka bir ajanda** yürüyor — o dosyalara dokunma.

**Goal:** Admin'in yüklediği doktor fotoğrafı **her kullanıcıda, her cihazda, her tarayıcıda** görünsün. Şu an fotoğraf yalnızca yükleyen admin'in `localStorage`'ında; başka kimse görmüyor.

**Architecture:** Fotoğraf tek kaynaktan gelir: `Doctor.PhotoUrl` (TEXT). Dosya, kalıcı diskte `wwwroot` **dışında** durur (Azure'da `/home/photos` — deploy'lar silmez) ve ikinci bir `PhysicalFileProvider` ile `/uploads/doctors/...` altından statik servis edilir. Dosya adı sürüm damgası taşıdığı için (`7-a3f1c9.webp`) `immutable` önbelleklenebilir: tarayıcı bir kez indirir, sonra sunucuya hiç dönmez. Yükleme, halihazırda `DoctorPhotos.tsx`'in `FileReader` ile ürettiği **data URL**'in JSON olarak POST edilmesiyle olur — multipart/`IFormFile` yok (aşağıdaki "Neden data URL" notuna bak).

**Sunucu yükü (kullanıcının asıl endişesi):** İstek başına maliyet ~0. Fotoğraf ne DB'den geçer ne API'den; işletim sisteminin `sendfile` yolundan giden statik bir dosyadır ve `max-age=31536000, immutable` ile ilk istekten sonra hiç istenmez. 6 doktor × ~150 KB ≈ 1 MB toplam disk. Yükleme yolu admin'de yılda birkaç kez çalışır.

**Tech Stack:** ASP.NET Core 10 Minimal API + EF Core/SQLite · React 19 + Vite 8 + TanStack Query · Azure App Service Linux B1

---

## Ön koşullar

Başlangıç durumu net olsun — bu plan mevcut testleri bozmamalı:

```bash
dotnet test backend.Tests/DocTick.Api.Tests.csproj
# Beklenen: Passed! - Failed: 0
```

Dal: `perf/login-to-home` (üretime deploy edilen dal budur; `main` 07-27'den kalma ayrık bir monorepo denemesi, **oraya merge etmeye çalışma**).

---

## Mevcut durum (kodda doğrulandı)

| Gerçek | Yer |
|---|---|
| Fotoğraflar `localStorage['doctick_doctor_photos']`'da, base64 data URL | `frontend/src/lib/doctorPhotos.ts:25-53` |
| `Doctor` tablosunda foto kolonu **yok** | `backend/Models/Db.cs:42-49` |
| Backend'de foto ucu **yok** | `backend/Endpoints/AdminEndpoints.cs` |
| Varsayılanlar Unsplash hotlink, doktor ID'leri 1–6 **frontend'de sabit** | `frontend/src/lib/doctorPhotos.ts:4-11` |
| "Yükleme" sahte: `setTimeout` ile ilerleme çubuğu, ağ isteği yok | `frontend/src/pages/admin/DoctorPhotos.tsx:68-92` |
| `DoctorAvatar` 4 yerde kullanılıyor | `DoctorPhotos.tsx:152`, `Doctors.tsx:59`, `Booking.tsx:160`, (+ kendi tanımı) |

Sabit ID haritası ayrıca **sessiz bir hata**: üretim DB'sindeki doktor ID'leri 1–6 olmak zorunda değil, o yüzden canlıda yanlış doktora yanlış foto düşebilir. Sunucuya taşımak bunu da kökten çözer.

---

## Dosya Haritası

| Dosya | Sorumluluk | Görev |
|---|---|---|
| `backend/Models/Db.cs` | `Doctor.PhotoUrl` kolonu + `EnsureSchemaAsync`'i tablo-bağımsız hâle getir | 1 |
| `backend/Services/PhotoStore.cs` | **Yeni** — data URL'i doğrula, diske yaz, eskisini sil. Tek sorumluluk, ayrı test edilebilir. | 2 |
| `backend.Tests/PhotoStoreTests.cs` | **Yeni** — doğrulama ve sürümleme testleri (planın runnable check'i) | 2 |
| `backend/Program.cs` | `Photos:Dir` config, `PhotoStore` DI kaydı, ikinci statik dosya sağlayıcısı | 3 |
| `backend/Endpoints/AdminEndpoints.cs` | `PUT /api/admin/doctors/{id}/photo`, `DELETE .../photo`; foto listede dönsün | 4 |
| `backend/Endpoints/PublicEndpoints.cs` | `DoctorDto`'ya `PhotoUrl` ekle | 4 |
| `frontend/src/api/client.ts` | `Doctor.photoUrl` alanı + `setDoctorPhoto`/`resetDoctorPhoto` çağrıları | 5 |
| `frontend/src/components/display/DoctorAvatar.tsx` | `localStorage` yerine prop'tan gelen `photoUrl` | 5 |
| `frontend/src/lib/doctorPhotos.ts` | **SİL** — yerine hazır galeri sabiti tek bir küçük dosyada kalır | 5 |
| `frontend/src/pages/admin/DoctorPhotos.tsx` | Sahte `setTimeout` ilerlemesi → gerçek mutation | 6 |

**Kapsam dışı (bilinçli):** Sunucu tarafı yeniden boyutlandırma/WebP dönüşümü (ImageSharp = yeni bağımlılık; 5 MB tavanı + istemci tarafı yeterli), kırpma (crop) arayüzü, hasta profil fotoğrafı, çoklu foto/galeri, CDN, blob storage.

---

## Task 1: `Doctor.PhotoUrl` kolonu + şema göçü

`Doctor`'a tek bir TEXT kolon. Boş string = "fotoğraf yok" → frontend baş harflere düşer.

```csharp
// backend/Models/Db.cs — Doctor sınıfına
// Ya "/uploads/doctors/7-a3f1c9.webp" (yüklenen dosya) ya "https://..." (hazır galeri) ya "" (yok).
// ponytail: tek kolon iki durumu da taşır — ayrı "kaynak tipi" kolonu ve enum'u yok.
public string PhotoUrl { get; set; } = "";
```

`EnsureSchemaAsync` şu an tabloyu sabit yazıyor (`ALTER TABLE "Users"`, `Db.cs:157`), o yüzden `Doctors` için kullanılamıyor. Demeti üçlüye çevir:

```csharp
var cols = new[]
{
    ("Users", "FirstName", "TEXT NOT NULL DEFAULT ''"),
    // ... mevcut 9 Users kolonu aynen, başına tablo adı eklenmiş hâlde ...
    ("Doctors", "PhotoUrl", "TEXT NOT NULL DEFAULT ''"),
};

foreach (var (table, colName, colType) in cols)
{
    try { await db.Database.ExecuteSqlRawAsync($"ALTER TABLE \"{table}\" ADD COLUMN \"{colName}\" {colType};"); }
    catch { /* kolon zaten var */ }
}
```

**Files:**
- Modify: `backend/Models/Db.cs:42-49` (`Doctor`), `backend/Models/Db.cs:138-164` (`EnsureSchemaAsync`)

**Step 1: Kolonu ve göçü ekle**
- [ ] `Doctor`'a `PhotoUrl` ekle
- [ ] `cols` dizisini `(table, col, type)` üçlüsüne çevir, `Doctors`/`PhotoUrl` satırını ekle
- [ ] `dotnet build backend/DocTick.Api.csproj` yeşil

**Step 2: Göçü hem yeni hem eski DB'de doğrula**
- [ ] `dotnet run --project backend` ile başlat, hata yok
- [ ] Mevcut `backend/doctick.db` üzerinde kolonun geldiğini gör:
      `sqlite3 backend/doctick.db "PRAGMA table_info(Doctors);"` → `PhotoUrl` satırı görünmeli
      (sqlite3 yoksa: `dotnet ef` yerine `/api/admin/doctors` yanıtında `photoUrl: ""` gördüğünde de doğrulanmış olur)
- [ ] `EnsureCreated()`'ın taze oluşturduğu DB'de de sorun olmadığını gör: `doctick.db`'yi geçici olarak yeniden adlandırıp başlat, seed çalışsın, sonra geri koy

---

## Task 2: `PhotoStore` — doğrulama + diske yazma

Tek sorumluluk: **güvenilmeyen** bir data URL alıp diske güvenli bir dosya bırakmak, eskisini silmek. Endpoint'ten ayrı durur ki testi HTTP olmadan koşsun.

Bu bir **güven sınırı**; CLAUDE.md'nin "tembel olunmayacak" listesinde. Dolayısıyla:

- **Boyut tavanı**: decode sonrası **5 MB** (arayüzdeki metin de 5 MB diyor, `DoctorPhotos.tsx:368`).
- **Tür, magic byte'tan** belirlenir — istemcinin `data:image/...` etiketine veya dosya adına **güvenilmez**. Kabul: PNG (`89 50 4E 47`), JPEG (`FF D8 FF`), WebP (`RIFF....WEBP`), GIF (`47 49 46 38`). Uzantı magic byte'tan türetilir.
- **Dosya adı asla istemciden gelmez**: `{doctorId}-{8 hex}{uzantı}`. Yol geçişi (`../`) imkânsız.
- Harici URL dalı: yalnız `https://` şemasına izin ver, 500 karakterle sınırla. (Sunucu bu URL'yi **çekmez** → SSRF yüzeyi yok; sadece `<img src>` olarak saklanır.)

```csharp
// backend/Services/PhotoStore.cs
namespace DocTick.Api.Services;

// Doktor fotoğrafını kalıcı diske yazar. wwwroot DIŞINDA tutulur: Azure'da wwwroot her deploy'da
// silinir, /home silinmez. Dosya adı sürüm damgası taşır → immutable önbelleklenebilir.
public sealed class PhotoStore(string dir)
{
    public const int MaxBytes = 5 * 1024 * 1024;
    public const string UrlPrefix = "/uploads/doctors/";

    // TUZAK: ASCII olmayan baytları u8 literaliyle yazma — "\x89PNG"u8, U+0089'u UTF-8'e
    // kodlayıp 0xC2 0x89 üretir, 0x89 değil. ASCII olmayan imzalar açık byte dizisi olmalı.
    private static readonly byte[] Png = [0x89, 0x50, 0x4E, 0x47];
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF];

    // Magic byte → uzantı. İstemcinin MIME etiketine ve dosya adına GÜVENİLMEZ.
    public static string? SniffExt(ReadOnlySpan<byte> b) =>
        b.Length >= 4 && b[..4].SequenceEqual(Png) ? ".png"
        : b.Length >= 3 && b[..3].SequenceEqual(Jpeg) ? ".jpg"
        : b.Length >= 12 && b[..4].SequenceEqual("RIFF"u8) && b[8..12].SequenceEqual("WEBP"u8) ? ".webp"
        : b.Length >= 4 && b[..4].SequenceEqual("GIF8"u8) ? ".gif"   // GIF87a ve GIF89a
        : null;

    // "data:image/png;base64,AAAA..." → bayt dizisi. Biçim bozuksa veya çok büyükse null.
    public static byte[]? DecodeDataUrl(string dataUrl) { /* ... */ }

    // Yazar ve YENİ göreli URL'i döner. oldUrl bize aitse (UrlPrefix ile başlıyorsa) siler.
    public string Save(int doctorId, byte[] bytes, string ext, string oldUrl) { /* ... */ }

    public void Delete(string url) { /* yalnız UrlPrefix ile başlayan yolları siler */ }
}
```

`Save` içinde ad: `$"{doctorId}-{Convert.ToHexString(RandomNumberGenerator.GetBytes(4)).ToLowerInvariant()}{ext}"`. Rastgele sonek, `immutable` cache'in doğru çalışması için şart — aynı ad tekrar kullanılırsa tarayıcı eski fotoyu bir yıl gösterir.

**Files:**
- Create: `backend/Services/PhotoStore.cs`
- Create: `backend.Tests/PhotoStoreTests.cs`

**Step 1: `PhotoStore`'u yaz**
- [ ] `SniffExt`, `DecodeDataUrl`, `Save`, `Delete` implement et
- [ ] `Save` yazmadan önce `Directory.CreateDirectory(dir)` (ilk çalıştırmada dizin yok)

**Step 2: Testleri yaz — planın runnable check'i**
- [ ] `.png` magic byte → `.png`; JPEG → `.jpg`; WebP → `.webp`
- [ ] `data:image/png;base64,` etiketi taşıyan ama **içi JPEG olan** girdi → `.jpg` (yani etikete güvenilmiyor)
- [ ] Rastgele/metin baytları → `SniffExt` null (reddedilir)
- [ ] 5 MB + 1 bayt → `DecodeDataUrl` null
- [ ] `Save` iki kez çağrılınca **farklı** dosya adı üretir ve eski dosya diskten silinir
- [ ] `Delete("https://images.unsplash.com/...")` hiçbir şey silmez, patlamaz
- [ ] `dotnet test backend.Tests/DocTick.Api.Tests.csproj` → Failed: 0

---

## Task 3: Kalıcı dizin + statik servis

**TUZAK (mevcut kodda yazılı):** `Program.cs:75-95`'teki `Configure<StaticFileOptions>` DI kaydına **dokunmak yasak** — `MapFallbackToFile` ayarı DI'dan okur, inline verilirse SPA derin linkleri `no-cache` almaz. Foto sağlayıcısı bu yüzden **ayrı** bir `UseStaticFiles(new StaticFileOptions {...})` çağrısı olur.

**TUZAK (yol seçimi):** `/media/...` **kullanma** — `wwwroot/media/doctick-hero.mp4` zaten var, iki sağlayıcı aynı ön ek altında karışır. Yol `/uploads/doctors/` olacak.

```csharp
// Program.cs — builder bölümünde, EmailService kaydının yanı
// Azure'da Photos__Dir=/home/photos (kalıcı; wwwroot her deploy'da silinir).
var photoDir = builder.Configuration["Photos:Dir"]
    ?? Path.Combine(builder.Environment.ContentRootPath, "photos");
builder.Services.AddSingleton(new PhotoStore(photoDir));
```

```csharp
// Program.cs — mevcut app.UseStaticFiles() (satır 129) HEMEN ARDINDAN
// Ayrı çağrı: yukarıdaki DI'daki StaticFileOptions'a dokunmuyoruz (bkz. satır 76-79 yorumu).
Directory.CreateDirectory(photoDir);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(photoDir),
    RequestPath = "/uploads/doctors",
    ServeUnknownFileTypes = false, // yalnız bilinen MIME'ler — dizine ne düşerse düşsün
    OnPrepareResponse = ctx =>
        // Dosya adı sürüm damgası taşır (7-a3f1c9.webp): içerik değişirse ad değişir.
        ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable",
});
```

**Files:**
- Modify: `backend/Program.cs` (~satır 39-43 arası kayıt; ~satır 129 sonrası middleware)

**Step 1: Kaydı ve middleware'i ekle**
- [ ] `Photos:Dir` okuma + `PhotoStore` singleton
- [ ] İkinci `UseStaticFiles`, `app.UseAuthentication()`'dan **önce** (fotolar herkese açık, tıpkı uygulama kabuğu gibi)
- [ ] `using Microsoft.Extensions.FileProviders;` ekle

**Step 2: Azure app setting'i ekle**
- [ ] `az webapp config appsettings set -g doctick-rg -n doctick --settings Photos__Dir=/home/photos`
- [ ] Doğrula: `az webapp config appsettings list -g doctick-rg -n doctick -o table | grep Photos`

**Step 3: Elle doğrula**
- [ ] `backend/photos/` altına elle bir `test.png` koy, backend'i başlat
- [ ] `curl -I http://localhost:5080/uploads/doctors/test.png` → `200` + `Cache-Control: public, max-age=31536000, immutable`
- [ ] `curl -I http://localhost:5080/uploads/doctors/../doctick.db` → **200 dönmemeli** (yol geçişi kapalı)
- [ ] Regresyon: `curl -I http://localhost:5080/randevularim` → hâlâ `Cache-Control: no-cache` (DI'daki ayar bozulmamış)

---

## Task 4: Admin uçları + DTO'lar

Uçlar `/api/admin` grubunda → `RequireAuthorization()` + `ActiveGuard.Admin` **zaten** uygulanıyor (`AdminEndpoints.cs:23-24`). Ek yetki kodu yazma.

**Neden data URL / JSON, multipart değil:**
1. `DoctorPhotos.tsx` zaten `FileReader.readAsDataURL` ile data URL üretiyor (`:52-56`) — frontend değişikliği bir `fetch` satırına iner.
2. .NET 8+'ta `IFormFile` alan minimal API uçları **varsayılan olarak antiforgery doğrulaması** ister; `.DisableAntiforgery()` demeden 400 döner. Bu tuzağa hiç girmiyoruz.
3. Base64 ~%33 fazla bayt taşır; 5 MB tavanında admin'in yılda birkaç kez yaptığı işlem için önemsiz.

```csharp
public record DoctorPhotoRequest(string? DataUrl, string? Url);

grp.MapPut("/doctors/{id}/photo", async (int id, DoctorPhotoRequest req, AppDb db, PhotoStore store, CancellationToken ct) =>
{
    var doc = await db.Doctors.FindAsync([id], ct);
    if (doc is null) return Results.NotFound();

    string newUrl;
    if (!string.IsNullOrWhiteSpace(req.DataUrl))
    {
        var bytes = PhotoStore.DecodeDataUrl(req.DataUrl);
        if (bytes is null) return Results.BadRequest("Geçersiz veya 5 MB'tan büyük görüntü.");
        var ext = PhotoStore.SniffExt(bytes);
        if (ext is null) return Results.BadRequest("Yalnız PNG, JPEG, WebP veya GIF kabul edilir.");
        newUrl = store.Save(id, bytes, ext, doc.PhotoUrl);
    }
    else if (!string.IsNullOrWhiteSpace(req.Url)
             && req.Url.Length <= 500
             && Uri.TryCreate(req.Url, UriKind.Absolute, out var u) && u.Scheme == "https")
    {
        // Hazır galeri dalı: URL saklanır, sunucu onu ÇEKMEZ (SSRF yüzeyi yok).
        // ponytail: harici hotlink — Unsplash yolu keserse foto kırılır. Kalıcı istenirse Task 2'deki
        // store.Save'e indirilmiş bayt verilir; şimdilik demo galerisi için kabul edilen tavan.
        store.Delete(doc.PhotoUrl);
        newUrl = req.Url;
    }
    else return Results.BadRequest("dataUrl veya https url gerekli.");

    doc.PhotoUrl = newUrl;
    await db.SaveChangesAsync(ct);
    return Results.Ok(new { doc.Id, doc.PhotoUrl });
});

grp.MapDelete("/doctors/{id}/photo", async (int id, AppDb db, PhotoStore store, CancellationToken ct) => { /* store.Delete + PhotoUrl = "" */ });
```

Ayrıca **üç** okuma yolunun da `PhotoUrl` döndürmesi gerekiyor:
- `PublicEndpoints.cs:9` → `DoctorDto(..., string PhotoUrl)`; `:33`'teki projeksiyona `d.PhotoUrl` ekle (hasta tarafı buradan besleniyor)
- `AdminEndpoints.cs:60-63` → anonim projeksiyona `d.PhotoUrl` ekle
- `AdminEndpoints.cs:78-85` (`PUT /doctors/{id}`) → **`PhotoUrl`'e dokunmamalı**; `DoctorUpsertRequest`'te foto alanı yok, doktor adı düzenlenince foto silinmesin. (Bunu doğrula, sessiz veri kaybı buradan çıkar.)

**Files:**
- Modify: `backend/Endpoints/AdminEndpoints.cs:10` (record), `:60-63` (GET), `:96` sonrası (yeni uçlar)
- Modify: `backend/Endpoints/PublicEndpoints.cs:9`, `:33`

**Step 1: DTO'ları genişlet**
- [ ] `DoctorDto`'ya `PhotoUrl`; iki projeksiyonu da güncelle
- [ ] `PUT /doctors/{id}`'nin `PhotoUrl`'ü ezmediğini kodda gör

**Step 2: Foto uçlarını ekle**
- [ ] `PUT /api/admin/doctors/{id}/photo` (data URL veya https URL)
- [ ] `DELETE /api/admin/doctors/{id}/photo`
- [ ] `dotnet build` yeşil, `dotnet test` Failed: 0

**Step 3: Uçları elle doğrula (backend ayakta, admin çerezi ile)**
- [ ] Küçük bir PNG'yi data URL'e çevirip PUT et → 200 + `/uploads/doctors/{id}-xxxxxxxx.png`
- [ ] `GET /api/doctors` yanıtında `photoUrl` dolu geliyor
- [ ] Dönen URL'i tarayıcıda aç → foto görünüyor
- [ ] İkinci kez PUT et → **yeni** ad döner, eski dosya `backend/photos/` içinde **kalmamış**
- [ ] Rastgele metni data URL diye gönder → 400
- [ ] `{"url":"http://example.com/x.png"}` (https değil) → 400
- [ ] `DELETE .../photo` → 200, `photoUrl` boş, dosya silinmiş

---

## Task 5: Frontend'i sunucu verisine bağla, `localStorage` katmanını sil

`DoctorAvatar` artık kendi başına veri okumaz — foto URL'ini **prop olarak alır**. Bu, "bileşen kendi verisini gizlice çeker" bağımlılığını kaldırır ve 4 çağrı yerinin hepsi elinde `doc` nesnesi zaten olduğu için diff küçüktür.

```tsx
// DoctorAvatar.tsx — doctorId artık gerekmiyor
interface DoctorAvatarProps {
  photoUrl?: string;   // boş/undefined → baş harflere düşer (mevcut fallback aynen kalır)
  name?: string;
  // ... size, showStatus, isActive, style, className, onClick aynen ...
}
```

`useDoctorPhotos` importunu ve `getPhoto` çağrısını sil (`:3`, `:26-27`); `imgError` fallback'i **olduğu gibi kalsın** — Unsplash hotlink'i kırıldığında baş harfler devreye girer, bu artık daha da değerli.

`frontend/src/lib/doctorPhotos.ts` **silinir**. İçindeki tek yaşayan parça `DEMO_PRESET_PHOTOS`; o `DoctorPhotos.tsx`'in içine (veya `lib/presetPhotos.ts`'e) taşınır. `DEFAULT_DOCTOR_PHOTOS`, `getStoredDoctorPhotos`, `setDoctorPhoto`, `resetDoctorPhoto`, `useDoctorPhotos`, `STORAGE_KEY`, `EVENT_NAME` — hepsi gider. *(Not: `DEMO_PRESET_PHOTOS`'ta `p7` ve `p8` aynı URL'i taşıyor, `doctorPhotos.ts:21-22`. Taşırken düzelt veya birini at.)*

**Files:**
- Modify: `frontend/src/api/client.ts:24` (`Doctor` arayüzü), `:126-129` civarı (yeni çağrılar)
- Modify: `frontend/src/components/display/DoctorAvatar.tsx:1-27`
- Modify: `frontend/src/pages/hasta/Booking.tsx:160`, `frontend/src/pages/admin/Doctors.tsx:59`
- Delete: `frontend/src/lib/doctorPhotos.ts`
- Create: `frontend/src/lib/presetPhotos.ts` (yalnız `DEMO_PRESET_PHOTOS`)

**Step 1: API katmanı**
- [ ] `Doctor` arayüzüne `photoUrl: string`
- [ ] `setDoctorPhoto: (id, body: { dataUrl?: string; url?: string })` → `PUT /api/admin/doctors/${id}/photo`
- [ ] `resetDoctorPhoto: (id)` → `DELETE /api/admin/doctors/${id}/photo`

**Step 2: `DoctorAvatar`'ı prop tabanlı yap ve çağrı yerlerini güncelle**
- [ ] `photoUrl` prop'u; `doctorId` kaldırıldı
- [ ] `Booking.tsx:160` → `<DoctorAvatar photoUrl={d.photoUrl} name={d.name} size={42} />`
- [ ] `Doctors.tsx:59` → `<DoctorAvatar photoUrl={r.photoUrl} name={r.name} size={42} />`

**Step 3: Ölü katmanı sil**
- [ ] `DEMO_PRESET_PHOTOS`'u taşı, `doctorPhotos.ts`'i sil
- [ ] `npx tsc --noEmit` → hata yok (kalan import varsa burada yakalanır)
- [ ] `grep -rn "doctorPhotos\|localStorage" frontend/src` → doktor fotosuyla ilgili hiçbir eşleşme kalmamalı

---

## Task 6: Admin yükleme ekranını gerçek isteğe bağla

`DoctorPhotos.tsx:68-92`'deki üç `setTimeout` sahte bir ilerleme çubuğu sürüyor. Yerine `useMutation`:

```tsx
const save = useMutation({
  mutationFn: (v: { id: number; dataUrl?: string; url?: string }) =>
    Api.setDoctorPhoto(v.id, { dataUrl: v.dataUrl, url: v.url }),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ['admin', 'doctors'] });
    qc.invalidateQueries({ queryKey: ['doctors'] }); // hasta tarafı listesi de tazelensin
    toast('success', `${selectedDoc!.name} için profil fotoğrafı güncellendi.`);
    // modalı kapat, previewUrl/selectedPreset sıfırla
  },
  onError: (e) => toast('error', e instanceof Error ? e.message : 'Fotoğraf yüklenemedi.'),
});
```

`isUploading`/`uploadProgress`/`uploadStatusText` state üçlüsü ve `setTimeout`'lar **silinir**; `save.isPending` hepsinin yerini tutar. İlerleme çubuğu bloğu (`:296-323`) belirsiz bir "Yükleniyor..." göstergesine iner veya tamamen kalkar — sahte yüzdeyi geri getirme.

`isCustom` hesabı (`:128`) artık `!!doc.photoUrl` ile yapılır; "Sıfırla" butonu `resetDoctorPhoto` mutation'ını çağırır. Preset seçimi `{ url }`, dosya yükleme `{ dataUrl }` gönderir.

**Files:**
- Modify: `frontend/src/pages/admin/DoctorPhotos.tsx` (tamamı gözden geçirilir; `:20-97` ve `:296-323` ağırlıklı)

**Step 1: Mutation'lara geç**
- [ ] `useMutation` + `useQueryClient`; `setTimeout` blokları silindi
- [ ] `storedPhotos`/`getStoredDoctorPhotos` yerine `doc.photoUrl`
- [ ] Dosya boyutu kontrolü **istemcide de** var: 5 MB üstü seçilirse `toast('error', ...)` ve isteği hiç atma (`handleFileChange`, `:39-57`)
- [ ] `<DoctorAvatar photoUrl={doc.photoUrl} ... />` (`:152`)

**Step 2: Uçtan uca doğrula (iki tarayıcı, iki hesap)**
- [ ] Admin ile `/admin/fotograflar`'a gir, bir doktora dosya yükle → foto anında değişiyor
- [ ] **Farklı bir tarayıcıda** (ya da gizli pencerede) **hasta** hesabıyla `/randevu-al` → aynı foto görünüyor ← *planın asıl kabul kriteri*
- [ ] Hazır galeriden bir preset seç → aynı doğrulamayı tekrarla
- [ ] "Sıfırla" → foto baş harflere dönüyor, iki tarafta da
- [ ] Sayfayı yenile → foto kalıcı (artık `localStorage` değil)
- [ ] Admin panelinde doktorun **adını** düzenle → fotoğrafı **kaybolmuyor**
- [ ] `npm run build` yeşil

---

## Task 7: Canlıya al ve doğrula

Deploy reçetesi ve tuzakları `memory/live-notes/doctick.md`'de yazılı — **birebir uygula**, özellikle:

1. `git archive HEAD | tar -x -C tmp` ile temiz paket (çalışma ağacından build **etme**; başka ajanların yarım işi olabilir)
2. `npm ci && npm run build`; `dist` → `backend/wwwroot`
3. `dotnet publish backend/DocTick.Api.csproj -c Release -r linux-x64 --self-contained false -o publish` (RID **şart**)
4. ZIP'i PowerShell `ZipArchive` ile elle üret ve her girdide `\` → `/` çevir (`zip` komutu bu makinede yok; ters bölü Kudu rsync'ini düşürür)
5. `az webapp deploy -g doctick-rg -n doctick --src-path app.zip --type zip` → `RuntimeSuccessful`, `numberOfInstancesFailed: 0`

**Step 1: Deploy öncesi**
- [ ] `Photos__Dir=/home/photos` app setting **ayarlı** (Task 3 Step 2) — yoksa fotolar `wwwroot` yanına yazılır ve **ilk deploy'da silinir**
- [ ] `dotnet test` Failed: 0 · `npm run build` yeşil

**Step 2: Deploy sonrası canlı doğrulama (`https://doctick.me`)**
- [ ] Admin ile foto yükle → `curl -I https://doctick.me/uploads/doctors/<ad>` → 200 + `immutable`
- [ ] Çıkış yap / başka hesapla gir → foto görünüyor
- [ ] `az webapp log tail -g doctick-rg -n doctick` içinde foto kaynaklı hata yok
- [ ] **Kalıcılık testi (kritik):** boş bir deploy daha çak (`az webapp deploy` aynı zip) → foto **hâlâ** yerinde. Bu adım `/home` seçiminin tek gerçek kanıtı, atlama.

**Step 3: Belgeleme + memkraft (CLAUDE.md zorunlu kuralı)**
- [ ] `docs/adr/0008-doktor-fotolari-home-diskinde-statik-servis.md` — neden `/home` + neden sürümlü dosya adı + neden data URL (multipart değil)
- [ ] `docs/05-api-endpointleri.md`'ye iki yeni uç
- [ ] `mk.log_event` + `mk.update("DocTick", ...)`: fotoların sunucuya taşındığı, `Photos__Dir`, `/uploads/doctors` yolu ve `wwwroot/media` çakışma tuzağı

---

## Bilinen tavanlar (bilinçli)

| Tavan | Neden kabul edildi | Yükseltme yolu |
|---|---|---|
| Sunucu tarafı yeniden boyutlandırma yok — 5 MB'lık dosya 5 MB olarak servis edilir | ImageSharp yeni bağımlılık; 6 doktor için değmez | Yük gerçekten sorun olursa `SixLabors.ImageSharp` ile `Save` içinde 256×256 WebP'e indir |
| Hazır galeri Unsplash'e hotlink | Tek kolon iki durumu taşıyor, ek kod yok | Preset seçiminde URL'i sunucuda bir kez indir (allow-list ile) ve `store.Save`'e ver |
| Eski `localStorage` fotoları göç etmez | Yalnız admin'in kendi tarayıcısında, 6 kayıt; elle yeniden yüklemek 1 dakika | — |
| Tek instance varsayımı (B1, 1 worker) | Ölçekleme yoksa yerel disk yeterli | Scale-out gerekirse Azure Blob Storage |
