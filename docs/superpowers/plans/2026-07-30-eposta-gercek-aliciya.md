# E-postalar Gerçek Alıcıya Gitsin — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` ile görev görev uygula. Adımlar checkbox (`- [ ]`) ile takip edilir. Bu plan **yalnız e-posta** işiyle ilgilidir; doktor fotoğrafları ayrı planda (`2026-07-30-doktor-fotograflari-sunucu-tarafi.md`) ve **başka bir ajanda** yürüyor — `PhotoStore`, `DoctorAvatar`, `doctorPhotos.ts`, `Doctor` modeli ve `Program.cs`'in statik dosya bölümüne **dokunma**.

**Goal:** Randevu alan kişiye onay, randevusu yaklaşan kişiye hatırlatma, iptal edene bilgilendirme, onaylanan/reddedilen kullanıcıya durum bildirimi — hepsi **kendi e-posta adresine** gitsin. Şu an hiçbiri gitmiyor.

---

## Kök neden (canlı sistemde doğrulandı, 2026-07-30)

**Kod suçlu değil.** Alıcı seçimi her yerde doğru:

| Akış | Alıcı | Yer |
|---|---|---|
| Randevu onayı | `me.Email` (randevuyu alan) | `backend/Endpoints/PatientEndpoints.cs:93` |
| Randevu iptali | `me.Email` (iptal eden) | `backend/Endpoints/PatientEndpoints.cs:119` |
| Hatırlatma | `a.User.Email` (randevu sahibi) | `backend/Services/ReminderService.cs:58` |
| Hesap onay/red | `u.Email` | `backend/Endpoints/AdminEndpoints.cs:133`, `:146` |
| İletişim formu | `Admin:Email` (kasıtlı) | `backend/Endpoints/PublicEndpoints.cs:83` |

Azure app settings de doğru — `Resend__ApiKey` dolu, `Resend__RedirectTo` **boş**, `Resend__FromEmail = randevu@doctick.me`.

Sorun **Resend tarafında**. `GET https://api.resend.com/domains`:

```json
{ "name": "doctick.me", "status": "not_started", "region": "ap-northeast-1" }
```

`doctick.me` domaini Resend'de kayıtlı ama **DNS kayıtları hiç eklenmemiş** (`not_started`). DNS'te canlı doğrulama:

```
resend._domainkey.doctick.me  → NXDOMAIN   (DKIM yok)
send.doctick.me               → NXDOMAIN   (SPF yok)
```

Yani: gönderen adresi doğrulanmamış bir domainde → Resend her `POST /emails` isteğini reddediyor → `EmailService` `InvalidOperationException` fırlatıyor → çağrı yerlerindeki `catch` bloklarında yutuluyor (randevu yine oluşuyor, sadece posta gitmiyor). `RedirectTo` de boş olduğu için yedek yol yok. Eskiden "çalışıyor gibi" görünüyordu çünkü `onboarding@resend.dev` + `RedirectTo=tahakeskin06@hotmail.com` kullanılıyordu — o da **sadece hesap sahibine** gönderebilir, "herkes için" hiç çalışmamıştı.

**Tek gerçek çözüm: domaini doğrulamak.** Bu 3 DNS kaydı demek; kod değişikliği zorunlu değil. Kalan görevler (2-4) bu fırsatta düzeltilecek gerçek kusurlar.

---

## Ön koşullar

```bash
dotnet test backend.Tests/DocTick.Api.Tests.csproj
# Beklenen: Passed! - Failed: 0
```

Dal: `perf/login-to-home` (üretime deploy edilen dal budur; `main`'e merge etmeye çalışma).

**DNS erişimi:** `doctick.me` Namecheap'te (`dns1/dns2.registrar-servers.com`). Kayıtları **kullanıcı elle ekleyecek** — Namecheap paneline ajan girmez. Ajanın işi: kayıtları birebir kopyalanabilir hâlde vermek, sonra doğrulamayı ve uçtan uca testi yapmak.

---

## Dosya Haritası

| Dosya | Sorumluluk | Görev |
|---|---|---|
| *(DNS — Namecheap paneli)* | DKIM + SPF kayıtları | 1 |
| `backend/appsettings.json` | Repo varsayılanı prod ile aynı olsun; `RedirectTo` boş | 2 |
| `backend/Services/ReminderService.cs` | Geçmiş randevuları sorgudan çıkar; "az önce alınmış randevuya hatırlatma" hatasını kapat | 3 |
| `backend.Tests/UnitTest1.cs:194-211` | `ReminderWindow` testleri yeni imzaya göre | 3 |
| `backend/Endpoints/AdminEndpoints.cs` | `GET /api/admin/email-health` (opsiyonel) | 4 |
| `frontend/src/pages/admin/EmailSettings.tsx` | Domain doğrulama durumunu göster (opsiyonel) | 4 |

**Kapsam dışı (bilinçli):** SMS/push bildirimi, e-posta kuyruğu (Hangfire/Azure Queue), şablon motoru, gönderim geçmişi tablosu, çoklu dil, abonelikten çıkma (unsubscribe) yönetimi, Resend webhook'ları.

---

## Task 1: `doctick.me` domainini Resend'de doğrula

### Adım 0 — Bölge kararı (şimdi ver, sonra maliyeti var)

Domain **`ap-northeast-1` (Tokyo)** bölgesinde kayıtlı. Uygulama `westeurope`'ta, alıcılar Türkiye'de. DNS kayıtları henüz eklenmediği için **bölgeyi şimdi değiştirmek bedava**; sonra değiştirmek DKIM kaydını baştan eklemek demek.

- [ ] Kullanıcıya sor: bölge `eu-west-1` (İrlanda) olsun mu? Öneri: **evet** — daha düşük gecikme, AB'de veri.
- [ ] "Evet" ise: Resend panelinden domaini **sil ve `eu-west-1` ile yeniden ekle**, sonra `GET /domains/{yeni-id}` ile **yeni** kayıtları al ve aşağıdaki tabloyu onlarla değiştir. DKIM `p=` değeri **değişir**, eskisini kullanma.
- [ ] "Hayır" ise aşağıdaki tabloyu olduğu gibi kullan.

### Adım 1 — Kullanıcıya verilecek DNS kayıtları

> Aşağıdaki değerler `ap-northeast-1` içindir (domain id `ba95e425-2584-4eaf-8ec7-aa2651348603`). Bölge değiştiyse Adım 0'daki yeni değerleri kullan.

**Namecheap → Domain List → doctick.me → Manage → Advanced DNS**

| # | Type | Host | Value | Priority | TTL |
|---|---|---|---|---|---|
| 1 | TXT Record | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDF7I0eQ2ImNIEz7afzG2D1M++j2XpC5VfyZC4/h6eFU8N4vbuHFHyt7dln0PFYz+g19KcRZMkvA1wxE0+3Ig3ok97qNzegih9rPLkF4na4gTT3JsMvQKQNYiVc9xH5/VNO05rL3WMOZnMn6Ece72+2Uzd2bw0jbyBVAFM+on+aowIDAQAB` | — | Automatic |
| 2 | TXT Record | `send` | `v=spf1 include:amazonses.com ~all` | — | Automatic |
| 3 | MX Record | `send` | `feedback-smtp.ap-northeast-1.amazonses.com` | `10` | Automatic |

**Namecheap tuzakları — kullanıcıya bunları da söyle:**

1. **Host alanına tam alan adı yazılmaz.** `resend._domainkey` yaz, `resend._domainkey.doctick.me` **yazma** — Namecheap domaini kendi ekler, yoksa kayıt `resend._domainkey.doctick.me.doctick.me` olur.
2. **DKIM değeri 392 karakter, TXT sınırı 255.** Namecheap bunu otomatik böler; değeri **olduğu gibi tek satır** yapıştır, elle bölmeye çalışma.
3. **MX kaydı (#3) "MAIL SETTINGS" bölümünü değiştirmeyi gerektirir.** Şu an mod **Email Forwarding** ve `@` üzerinde 5 tane `eforward*` MX kaydı var. `send` alt alanına MX eklemek için mod **Custom MX**'e alınmalı — bu, `@` üzerindeki forwarding kayıtlarını **temizler**. `@doctick.me` adresine gelen postayı kaybetmemek için Custom MX'e geçtikten sonra bu 5 kaydı **birebir** geri ekle:

   | Type | Host | Value | Priority |
   |---|---|---|---|
   | MX | `@` | `eforward1.registrar-servers.com` | 10 |
   | MX | `@` | `eforward2.registrar-servers.com` | 10 |
   | MX | `@` | `eforward3.registrar-servers.com` | 10 |
   | MX | `@` | `eforward4.registrar-servers.com` | 15 |
   | MX | `@` | `eforward5.registrar-servers.com` | 20 |

4. **Kökteki mevcut SPF'e dokunma.** `doctick.me` TXT'inde `v=spf1 include:spf.efwd.registrar-servers.com ~all` var; Resend'in SPF'i `send` **alt alanında** olduğu için çakışmaz. İkisini birleştirmeye kalkma.

**Güvenli alternatif (MX riski istenmezse):** Yalnız #1 (DKIM) ve #2 (SPF TXT) eklenir, MX atlanır. Resend domaini genelde DKIM ile doğrular; MX yalnız bounce/şikâyet geri bildirimi içindir. Bu dalda: kayıtları ekle, doğrulamayı çalıştır, `status` `verified` olduysa devam et. Olmadıysa MX'i de eklemek gerekir — o zaman 3. maddeye dön.

### Adım 2 — Kayıtları doğrula (ajan yapar)

- [ ] Kullanıcı "ekledim" dedikten sonra DNS yayılımını bekle (Namecheap'te tipik 5–30 dk):
```bash
nslookup -type=TXT resend._domainkey.doctick.me 8.8.8.8   # p=MIGf... görünmeli
nslookup -type=TXT send.doctick.me 8.8.8.8                # v=spf1 include:amazonses.com görünmeli
nslookup -type=MX  send.doctick.me 8.8.8.8                # feedback-smtp... (eklendiyse)
```
- [ ] Üçü de NXDOMAIN dönmüyor → Resend doğrulamasını tetikle:
```bash
curl -s -X POST "https://api.resend.com/domains/<DOMAIN_ID>/verify" -H "Authorization: Bearer $RESEND_KEY"
```
- [ ] Durumu oku (yayılma gecikmesi varsa 1–2 dk arayla tekrarla, **döngüye girme** — 5 denemede olmuyorsa DNS'e geri dön):
```bash
curl -s "https://api.resend.com/domains/<DOMAIN_ID>" -H "Authorization: Bearer $RESEND_KEY"
```
- [ ] **Kabul kriteri:** `"status": "verified"`

> **API anahtarını komut satırına yazma.** `az webapp config appsettings list` çıktısında duruyor; kabuk değişkenine al (`RESEND_KEY=...`) veya `az` ile oku. Anahtar git geçmişinde bir kez göründü (`docs/secrets.md`) — bu iş biterse **rotate edilmesi** gereken maddelerden biri, aşağıdaki "Kalanlar"a bak.

### Adım 3 — Gerçek gönderim testi

Doğrulama `verified` olmadan bu adıma **geçme**.

- [ ] Kendi adresin **dışında** bir adrese tek bir test postası at (Resend'in artık gerçekten üçüncü kişiye gönderebildiğinin kanıtı budur — `RedirectTo` boş olduğu için kod yolu da aynısı):
```bash
curl -s -X POST "https://api.resend.com/emails" -H "Authorization: Bearer $RESEND_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"DocTick <randevu@doctick.me>","to":["<ADMIN_OLMAYAN_ADRES>"],"subject":"DocTick test","html":"<p>test</p>"}'
```
- [ ] `201` + bir `id` dönüyor; `403 "You can only send testing emails to your own email address"` **dönmüyor**
- [ ] Posta **Gelen Kutusu**'na düştü mü, Spam'e mi? Spam'e düştüyse SPF MX kaydı (#3) atlanmış olabilir — ekleyip tekrar dene.

---

## Task 2: Repo varsayılanını prod ile hizala

`backend/appsettings.json:14-19` şu an şunu diyor:

```json
"Resend": { "ApiKey": "", "FromEmail": "onboarding@resend.dev", "RedirectTo": "tahakeskin06@hotmail.com" }
```

Bu commit'lenmiş varsayılan **sessiz bir tuzak**: Azure'daki `Resend__RedirectTo` app setting'i bir gün silinirse (veya biri lokalde prod DB'sine bağlanırsa) **tüm** kullanıcı postaları sessizce tek bir kişiye gider ve kimse fark etmez. Domain doğrulandıktan sonra bu köprünün varlık sebebi de kalmıyor.

```json
"Resend": {
  "ApiKey": "",
  "FromEmail": "randevu@doctick.me",
  "FromName": "DocTick",
  "RedirectTo": ""
}
```

`RedirectTo` mekanizmasını **koddan silme** — `EmailService.cs:32-34` doğrulanmamış domainle geliştirme yapmak için hâlâ meşru bir kaçış kapısı; sadece varsayılanı boş olacak. (`ApiKey` boş kalır: gizli anahtar repoda durmaz, `EmailService.cs:26-30` anahtar yoksa sessizce no-op yapıp uyarı basar — geliştirme bilerek böyle.)

**Files:**
- Modify: `backend/appsettings.json:14-19`

**Step 1: Varsayılanları güncelle**
- [ ] `FromEmail` → `randevu@doctick.me`, `RedirectTo` → `""`
- [ ] `docs/adr/0005-resend-raw-http-redirect-to.md`'ye kapanış notu: domain 2026-07-30'da doğrulandı, `RedirectTo` artık boş, mekanizma yalnız yerel geliştirme için duruyor
- [ ] `backend/appsettings.Development.json`'da `Resend` bölümü varsa orada da `RedirectTo` boş mu, kontrol et

---

## Task 3: Hatırlatma servisindeki iki gerçek kusur

### Kusur A — Sorgu sonsuza kadar büyüyor

`ReminderService.cs:40-44` **filtresiz** çalışıyor:

```csharp
var due = await db.Appointments
    .Include(...)
    .Where(a => a.Status == ApptStatus.Confirmed && a.ReminderSentAt == null)
    .ToListAsync(ct);
```

Hatırlatma gönderilemeyen (veya penceresine hiç girmemiş) her geçmiş randevu **sonsuza dek** her 5 dakikada bir DB'den çekilip iki tabloyla join'lenip elde eleniyor. Tarih filtresi sorguya taşınır:

```csharp
var todayIso = DateTime.Now.ToString("yyyy-MM-dd");
var due = await db.Appointments
    .Include(a => a.User)
    .Include(a => a.Doctor!).ThenInclude(d => d!.Department)
    .Where(a => a.Status == ApptStatus.Confirmed && a.ReminderSentAt == null
                && a.Date.CompareTo(todayIso) >= 0)   // geçmiş randevuya hatırlatma gitmez (satır 39'daki kural)
    .ToListAsync(ct);
```

`string.CompareTo` SQLite'a native çevriliyor — bu projede zaten doğrulanmış bir kalıp (`AdminEndpoints.cs:184`).

### Kusur B — Az önce alınan randevuya hemen "randevunuz yaklaşıyor" gidiyor

`ReminderWindow.IsDue` (`ReminderService.cs:82-83`) yalnız "randevu gelecekte **ve** 24 saatten yakın" diye bakıyor. Hasta **yarın** için randevu aldığında randevu daha alındığı anda 24 saatlik pencerenin **içinde** oluyor → bir sonraki tick'te (≤5 dk) hatırlatma gidiyor. Kullanıcı onay postasından 5 dakika sonra "randevunuz yaklaşıyor" postası alıyor. "Kimin randevusu yaklaşıyorsa ona gitsin" istenen davranış bu değil.

Doğru kural: randevu **alındığı anda** pencerenin içindeyse onay postası hatırlatma görevini de görmüştür, ayrıca hatırlatma gönderilmez.

```csharp
// start gelecekte VE pencereye girmiş VE randevu pencereye girmeden önce alınmışsa due.
// createdAt yerel saate çevrilmiş olmalı: Appointment.CreatedAt UTC yazılıyor
// (PatientEndpoints.cs:67) ama start/now yerel — Azure'da TZ=Europe/Istanbul, 3 saat fark eder.
public static bool IsDue(DateTime start, DateTime now, int hoursBefore, DateTime createdAtLocal) =>
    start > now
    && start <= now.AddHours(hoursBefore)
    && createdAtLocal < start.AddHours(-hoursBefore);
```

Çağrı yerinde (`ReminderService.cs:50`): `ReminderWindow.IsDue(start, now, setting.ReminderHoursBefore, a.CreatedAt.ToLocalTime())`.

> `ToLocalTime()`, `CreatedAt`'in `DateTimeKind.Utc` olmasına bağlıdır. EF Core/SQLite okumada `Kind`'ı `Unspecified` döndürebilir — o zaman `ToLocalTime()` **hiçbir şey çevirmez** ve karşılaştırma 3 saat kayar. Bunu testle sabitle: `DateTime.SpecifyKind(a.CreatedAt, DateTimeKind.Utc).ToLocalTime()` kullan ve testte doğrula.

**Files:**
- Modify: `backend/Services/ReminderService.cs:36-50` (sorgu + çağrı), `:79-84` (`ReminderWindow`)
- Modify: `backend.Tests/UnitTest1.cs:194-211` (mevcut iki test yeni imzaya göre)

**Step 1: `IsDue`'yu genişlet ve testleri yaz — planın runnable check'i**
- [ ] `IsDue`'ya `createdAtLocal` parametresi
- [ ] Mevcut iki test yeni imzaya uyarlandı (eski çağrılar için `createdAtLocal`, pencereden **önce** bir zaman verilir → davranış değişmez)
- [ ] **Yeni test:** 20 saat sonrası bir randevu, **şimdi** alınmış, `hoursBefore = 24` → `IsDue` **false** (Kusur B)
- [ ] **Yeni test:** 20 saat sonrası bir randevu, 3 gün önce alınmış → `IsDue` **true**
- [ ] **Yeni test:** `CreatedAt` `Kind=Unspecified` geldiğinde de doğru karar (UTC olarak yorumlanır)
- [ ] `dotnet test backend.Tests/DocTick.Api.Tests.csproj` → Failed: 0

**Step 2: Sorguya tarih filtresi**
- [ ] `a.Date.CompareTo(todayIso) >= 0` eklendi
- [ ] `dotnet build` yeşil; elde eleme yapan `if (!ReminderWindow.IsDue(...)) continue;` satırı **kalsın** (saat hassasiyeti orada)

---

## Task 4 (opsiyonel, önerilir): E-posta sağlığı admin'e görünsün

Bu arıza haftalarca fark edilmedi çünkü hata yalnız sunucu loglarına düşüyor (`EmailService.cs:57`) ve çağrı yerlerinde `catch` ile yutuluyor (`PatientEndpoints.cs:97,122`, `AdminEndpoints.cs:134,147`). Yutma davranışı **doğru** — posta gönderilemedi diye randevu iptal edilmemeli. Eksik olan, admin'in bunu görebileceği bir yer.

En küçük çözüm: mevcut "E-posta ayarları" sayfasına domain durumunu koyan tek bir uç.

```csharp
// AdminEndpoints.cs — Ayarlar bölümünün yanı
// Resend'in domain durumunu aynen yansıtır. 'verified' değilse HİÇBİR posta gitmez.
grp.MapGet("/email-health", async (IHttpClientFactory http, IOptions<EmailOptions> opt, CancellationToken ct) =>
{
    var o = opt.Value;
    if (string.IsNullOrWhiteSpace(o.ApiKey))
        return Results.Ok(new { ok = false, reason = "API anahtarı yapılandırılmamış.", from = o.FromEmail, redirectTo = o.RedirectTo });
    // ... GET https://api.resend.com/domains, FromEmail'in domainini bul, status'u dön ...
});
```

`EmailSettings.tsx`'e küçük bir durum satırı: yeşil "Doğrulandı — postalar gerçek alıcıya gidiyor" / kırmızı "`doctick.me` doğrulanmadı — hiçbir e-posta gönderilemiyor" + `RedirectTo` doluysa sarı "TÜM postalar `x` adresine yönlendiriliyor" uyarısı. Bu son uyarı, Task 2'deki tuzağın bir daha sessiz kalmamasını sağlar.

**Files:**
- Modify: `backend/Endpoints/AdminEndpoints.cs` (Ayarlar bölümü civarı, `:202-216`)
- Modify: `frontend/src/api/client.ts` (`emailHealth` çağrısı), `frontend/src/pages/admin/EmailSettings.tsx:29-42`

**Step 1: Uç**
- [ ] `GET /api/admin/email-health` (admin grubunda → yetki zaten var)
- [ ] Resend'e giden çağrı **hata fırlatmasın**: ağ hatasında `ok = false` + sebep dönsün, admin paneli patlamasın
- [ ] Yanıtta **API anahtarı yok** — yalnız durum, `from` ve `redirectTo`

**Step 2: Panelde göster**
- [ ] `EmailSettings.tsx`'e durum satırı; `verified` değilse belirgin kırmızı
- [ ] `npm run build` yeşil

---

## Task 5: Canlıya al ve uçtan uca doğrula

Deploy reçetesi ve tuzakları `memory/live-notes/doctick.md`'de — birebir uygula:

1. `git archive HEAD | tar -x -C tmp` ile temiz paket (çalışma ağacından build **etme**)
2. `npm ci && npm run build`; `dist` → `backend/wwwroot`
3. `dotnet publish backend/DocTick.Api.csproj -c Release -r linux-x64 --self-contained false -o publish` (RID **şart**)
4. ZIP'i PowerShell `ZipArchive` ile üret, her girdide `\` → `/` (`zip` komutu bu makinede yok)
5. `az webapp deploy -g doctick-rg -n doctick --src-path app.zip --type zip` → `RuntimeSuccessful`, `numberOfInstancesFailed: 0`

**Step 1: Deploy öncesi**
- [ ] Task 1 `verified` **oldu** (olmadıysa deploy'un anlamı yok, orada bekle)
- [ ] `az webapp config appsettings list -g doctick-rg -n doctick -o table` → `Resend__RedirectTo` **boş**, `Resend__FromEmail = randevu@doctick.me`
- [ ] `dotnet test` Failed: 0 · `npm run build` yeşil

**Step 2: Uçtan uca — kendi adresin dışında bir hesapla (`https://doctick.me`)**

Kabul kriteri bu adım. Test hesabı **admin e-postası olmayan** bir adres olmalı, yoksa `RedirectTo` hatası tekrar gizlenir.

- [ ] Test hesabıyla Google ile giriş → admin panelinden **onayla** → "Hesabınız onaylandı" postası **o hesaba** düştü
- [ ] Test hesabıyla randevu al → "Randevu onayı" postası düştü, içinde doğru doktor/bölüm/tarih/saat ve `RND-...` kodu var
- [ ] Randevuyu iptal et → "Randevu iptali" postası düştü
- [ ] Gönderen `DocTick <randevu@doctick.me>` görünüyor, `onboarding@resend.dev` **değil**; konu satırında `[→ ...]` eki **yok** (yönlendirme kapalı demektir)
- [ ] Logoyu görüyor (CID eki, `EmailService.cs:43`), Gelen Kutusu'nda — Spam'de değil
- [ ] **Hatırlatma testi:** `E-posta ayarları`'ndan hatırlatmayı **2 saat önce**'ye al, sonra ~1 saat sonrası bir saate randevu al. Beklenen: **hemen hatırlatma gelmez** (Task 3 Kusur B; randevu alındığında pencerenin içindeydi). Ardından yarın için randevu al ve hatırlatmayı 24 saate çevir → bir sonraki tick'te (≤5 dk) hatırlatma gelir. Ayarı eski hâline (24) döndür.
- [ ] `az webapp log tail -g doctick-rg -n doctick` → `Resend hatası` satırı **yok**

**Step 3: Belgeleme + memkraft (CLAUDE.md zorunlu kuralı)**
- [ ] `docs/adr/0005-resend-raw-http-redirect-to.md`'ye kapanış notu (Task 2)
- [ ] `mk.log_event` + `mk.fact_add("DocTick", "email_domain_verified", ...)` + `mk.update("DocTick", ...)`: kök nedenin `status: not_started` olduğu, eklenen 3 DNS kaydı, Namecheap Custom MX / eforward tuzağı, hatırlatma penceresi düzeltmesi
- [ ] `memory/live-notes/doctick.md`'deki "E-posta alt sistemi çalışmıyor" notlarının artık **kapandığını** işaretle (2026-07-23 tarihli iki not yanıltıcı kalmasın)

---

## Bu planın kapatmadığı, kullanıcıya söylenmesi gerekenler

| Konu | Durum |
|---|---|
| **API anahtarı rotasyonu** | `Resend__ApiKey` git geçmişinde bir kez göründü (`docs/secrets.md`) ve bu oturumda `az` çıktısında okundu. Teslimden önce Resend panelinden **rotate edilmeli**, sonra `az webapp config appsettings set` ile güncellenmeli. Bu plan bunu **yapmıyor** — anahtarı değiştirmek canlı e-postayı anlık kırar, kullanıcının kararı. |
| **`Google__ClientSecret`** | Aynı `az` çıktısında düz metin duruyor (`GOCSPX-...`). E-posta kapsamı dışı ama aynı sınıf risk; `docs/secrets.md` bunu da rotasyon listesinde sayıyor. |
| **Bounce/şikâyet yönetimi** | Resend webhook'ları kurulmadı; geçersiz adrese giden postanın döndüğü görülmez. 6 doktorluk staj projesi için kabul edilen tavan. |
| **Kuyruk yok** | Gönderim istek yolunda (best-effort). Resend anlık düşerse o posta kaybolur — sadece hatırlatmalar bir sonraki tick'te yeniden denenir (`ReminderService.cs:56-67`). Onay/iptal postaları yeniden denenmez. |
