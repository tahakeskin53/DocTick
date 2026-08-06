# İletişim mesajları paneli + doktor puan özeti — tasarım

> Tarih: 2026-08-06 · Hedef: **yalnız `https://doctick.me` (üretim)** · Durum: onay bekliyor

İki bağımsız özellik, tek spec:

- **A.** Hastanın iletişim formundan gönderdiği mesaj admin panelinde görünsün; admin yanıtlayınca hastaya **e-posta** olarak gitsin.
- **B.** Hastanın verdiği randevu puanlarını doktor kendi hesabında **anonim** ve yalnız **ortalama** olarak görsün.

Yerel geliştirme kurulumu kapsam dışı — plan doğrudan üretim ortamını hedefler.

---

## 0. Mevcut durum (kod okumasından)

| Konu | Bugün |
|---|---|
| İletişim formu | `frontend/src/pages/hasta/Iletisim.tsx` → `POST /api/contact` (`backend/Endpoints/PublicEndpoints.cs:65`). Mesaj **hiçbir yere kaydedilmiyor**, yalnız `Admin:Email` adresine e-posta atılıyor. |
| Gönderim hatası | Resend hata verirse uç **502** döner ve **mesaj tamamen kaybolur** — kaydedilmediği için geri getirilemez. |
| Puanlama | `Appointment.Rating` (1–5, nullable) **zaten var** (`backend/Models/Db.cs:84`). Hasta `POST /api/appointments/{id}/rating` ile veriyor, yalnız geçmiş+onaylı randevu puanlanabiliyor. |
| Doktorun gördüğü | `DoctorApptDto` (`DoctorEndpoints.cs:11`) `Rating` **taşımıyor** — doktor puanları hiç görmüyor. |
| Şema yönetimi | `Program.cs:207` → `db.Database.EnsureCreated()`. **Var olan bir DB'ye yeni tablo eklemez.** Sonradan eklenen tablolar (`LabResults`, `LabValues`, `ImagingStudies`) `DbSeeder.EnsureSchemaAsync` içinde ham `CREATE TABLE IF NOT EXISTS` ile yaratılıyor. |
| Üretim DB'si | `/home/doctick.db` (Azure Files, deploy'dan etkilenmez — `docs/12-azure-deployment.md` §0.2). Zaten dolu. |

**Bu spec'in en kritik tek maddesi:** `ContactMessages` tablosu `EnsureSchemaAsync` içine ham SQL olarak girmezse deploy sorunsuz geçer, uygulama **ilk mesajda 500 verir**. `EnsureCreated()` dolu bir DB'de hiçbir şey yapmaz.

---

## A. İletişim mesajları

### A.1 Veri modeli

Tek yeni varlık — `backend/Models/Db.cs`:

```
ContactMessage
  Id         int
  UserId     int      → FK Users(Id) ON DELETE CASCADE
  User       User?    (navigation)
  Subject    string   (≤150)
  Body       string   (≤2000)
  CreatedAt  DateTime
  ReplyText  string   ("" — yanıtlanana kadar)
  RepliedAt  DateTime?
```

`AppDb`'ye `DbSet<ContactMessage> ContactMessages`.

**Ayrı `Status` sütunu yok.** `RepliedAt is null` ⇒ "Yeni", değilse "Yanıtlandı". Projenin mevcut idiyomu bu: `Done` durumu da saklanmıyor, okuma anında türetiliyor (`Db.cs:10`, `PatientEndpoints.DisplayStatus`). İki yerde tutulan bir durum, tutarsızlık yüzeyidir.

**Gönderen bilgisi kopyalanmıyor** (ad/e-posta snapshot'ı yok) — `Include(User)` ile okunur. Kullanıcı silinirse mesajları da CASCADE ile gider; admin zaten var olmayan bir kişiye yanıt yazamaz.

### A.2 Şema oluşturma (üretim için zorunlu)

`DbSeeder.EnsureSchemaAsync` içindeki mevcut `ExecuteSqlRawAsync` bloğuna eklenir:

```sql
CREATE TABLE IF NOT EXISTS "ContactMessages" (
    "Id"        INTEGER NOT NULL CONSTRAINT "PK_ContactMessages" PRIMARY KEY AUTOINCREMENT,
    "UserId"    INTEGER NOT NULL,
    "Subject"   TEXT NOT NULL DEFAULT '',
    "Body"      TEXT NOT NULL DEFAULT '',
    "CreatedAt" TEXT NOT NULL,
    "ReplyText" TEXT NOT NULL DEFAULT '',
    "RepliedAt" TEXT NULL,
    CONSTRAINT "FK_ContactMessages_Users_UserId"
        FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
);
```

Sütun tipleri `LabResults` bloğuyla birebir aynı konvansiyonu izler (`DateTime` → `TEXT`).

### A.3 `POST /api/contact` — davranış değişikliği

Sıra **tersine çevrilir**:

| | Bugün | Yeni |
|---|---|---|
| 1 | Doğrula | Doğrula (aynı: konu 1–150, mesaj 1–2000) |
| 2 | Admin'e e-posta gönder | **Satırı DB'ye yaz** |
| 3 | Hata → **502, mesaj kayboldu** | Admin'e bildirim e-postası dene — **best-effort**, hata yutulur ve loglanır |
| 4 | — | **200** |

Gerekçe: mesajın kalıcı kaydı artık DB'de. Bildirim e-postası yalnızca bir *uyarı kanalı*; gitmese bile mesaj admin panelinde duruyor. Yani **site içi panelin kendisi, e-posta yolunun geri bildirimidir**. Bu, istenen özelliğin yan ürünü olarak gerçek bir veri kaybı hatasını kapatır.

`Admin:Email` yapılandırılmamışsa: satır yine yazılır, e-posta atlanır, log'a uyarı düşer, 200 döner. (Bugünkü 500 davranışı artık yanlış olurdu — mesaj kaydedilmiş oluyor.)

HTML kaçışı (`WebUtility.HtmlEncode`) **yalnız e-posta gövdesi üretilirken** uygulanır; DB'ye ham metin yazılır. Kaçırılmış metni saklamak, aynı veriyi ikinci kez kaçırma (double-encode) riskidir ve panelde `&amp;` gibi artıklar görünür.

### A.4 Yeni admin uçları

`backend/Endpoints/AdminEndpoints.cs` (mevcut `grp` = `/api/admin`, `ActiveGuard.Admin` filtresi altında):

**`GET /api/admin/contact-messages?unanswered=true`**
Yeniden eskiye (`CreatedAt DESC`). DTO:
`(Id, SenderName, SenderEmail, Subject, Body, CreatedAt, ReplyText, RepliedAt)`

**`POST /api/admin/contact-messages/{id}/reply`** — gövde `{ reply }`
1. Mesajı `Include(User)` ile bul → yoksa **404**
2. `ContactMessages.ValidateReply(msg, reply)` → hata varsa **400** (bkz. A.6)
3. Hastaya e-posta gönder — `EmailTemplates.ContactReply(...)`
4. **Başarılıysa** `ReplyText` + `RepliedAt` yazılır, `SaveChanges`, **200**
5. **Gönderim hata verirse** → `RepliedAt` null kalır, satır değişmez, **502** (bkz. A.5)

`AuditLog.Event(ctx, "contact_reply", $"{msg.User!.Email} · {msg.Subject}")` — mevcut denetim deseni.

**`DELETE /api/admin/contact-messages/{id}`** — 404 veya 204.
*Kullanıcı bunu istemedi; silinemeyen bir gelen kutusu birkaç ay sonra kullanılamaz hâle geldiği için eklendi. Kapsamdan çıkarılması tek uç + tek buton silmek demektir.*

### A.5 E-posta/DB sırası — bilinçli asimetri

Kod tabanındaki mevcut kural, `approve`/`reject`/`cancel` uçlarında **best-effort e-posta**: durum değişikliği kalıcıdır, bildirim gidemezse yutulur (`AdminEndpoints.cs:250`, `DoctorEndpoints.cs:79`). Orada e-posta bir *yan bildirimdir*.

**Yanıt ucunda tersi geçerlidir: e-posta işin kendisidir.** Hasta için başka bir kanal yok (kullanıcı kararı: hastaya ek ekran yapılmayacak). Bu yüzden e-posta gitmeden mesaj "yanıtlandı" işaretlenmez — aksi hâlde admin panelde yanıtlanmış görünen ama hastaya hiç ulaşmamış mesajlar birikir ve bu sessizce olur.

**Hata hâlinde admin'e site içi geri bildirim** (kullanıcı talebi — ham 502 yeterli değil):

| Katman | Davranış |
|---|---|
| Kalıcı iz | Mesaj "Yanıt bekleyenler" listesinde kalır — geri bildirimin kalıcı hâli budur |
| Dialog | **Kapanmaz**, yazılan yanıt metni **korunur** — admin baştan yazmadan tekrar dener |
| Toast | `error` · *"Yanıt e-postası gönderilemedi. Mesaj yanıtlanmadı olarak kaldı, birazdan tekrar deneyin."* |
| Ayırt etme | `ApiError.status === 502` üzerinden. Resend'in ham hata metni **kullanıcıya gösterilmez** (sunucu log'una yazılır) |

### A.6 Doğrulama kuralları

`ContactMessages.ValidateReply(ContactMessage msg, string reply)` → hata mesajı veya `null`.
Statik ve DbContext'siz — `DoctorRemoval.ShouldCancel` deseniyle aynı, böylece DB olmadan test edilir (bkz. `docs/10-testler.md`).

| Kural | Mesaj |
|---|---|
| `reply` boş/whitespace | "Yanıt boş olamaz." |
| `reply.Trim().Length > 2000` | "Yanıt en fazla 2000 karakter olabilir." |
| `msg.RepliedAt is not null` | "Bu mesaj zaten yanıtlanmış." |

Tek yanıt modeli: yanıtlanmış mesaj yeniden yanıtlanamaz (kullanıcı kararı — konuşma dizisi kapsam dışı).

### A.7 E-posta şablonu

`EmailTemplates.ContactReply(name, subject, originalHtml, replyHtml)` — mevcut `Shell(...)` üzerine, yeni bir düzen icat edilmez.

- Başlık: *"Mesajınıza yanıt"*
- Konu satırı: `DocTick — Mesajınıza yanıt: {subject}`
- Gövde: `Sayın {name},` → admin yanıtı → altında hastanın **orijinal mesajı** mevcut gri alıntı kutusunda (`Contact(...)` şablonundaki kutunun aynısı), böylece hasta neye yanıt geldiğini hatırlar
- `name`, `subject`, her iki metin de `WebUtility.HtmlEncode`'dan geçer; satır sonları `<br>`'e çevrilir

### A.8 Admin arayüzü

**Yeni sayfa** `frontend/src/pages/admin/Mesajlar.tsx` · **route** `/admin/mesajlar` (`router.tsx`, lazy) · **nav** `AdminLayout.ITEMS`.

- Üstte geçiş: **Yanıt bekleyenler / Tümü** — `DoktorRandevular.tsx`'teki `Button variant` toggle deseni
- Kart listesi: gönderen adı · e-posta · konu · tarih · `Badge` ("Yeni" / "Yanıtlandı")
- Karta tıklama → `Dialog`: tam mesaj metni + `Textarea` (2000 sayaçlı, `Iletisim.tsx`'teki gibi) + **"Yanıtla ve gönder"**
- Yanıtlanmış mesajda: yanıt metni ve yanıt tarihi **salt okunur**, gönderme alanı yok
- Silme: kartta `IconButton` + `trash`, onay `Dialog`'u (`Doctors.tsx`'teki `confirmDel` deseni)
- Sorgu anahtarı `['admin','contact-messages']`; başarılı yanıt sonrası `invalidateQueries`

**İkon düzeltmesi** (üç satır): `mail` şu an "E-posta ayarları"nda kullanılıyor. Mesajlar → `mail`, E-posta ayarları → `bell` (zaten hatırlatma bildirimi ayarı), Kullanıcılar → `check` (onay kuyruğu). Üçü de bugünkünden isabetli.

`frontend/src/api/client.ts`: `ContactMessage` arayüzü + `adminContactMessages(unansweredOnly?)`, `replyContactMessage(id, reply)`, `deleteContactMessage(id)`.

---

## B. Doktorun kendi puan özeti

### B.1 Şema değişikliği yok

`Appointment.Rating` zaten var ve hasta tarafından doldurulmuş durumda. Bu özellik **yalnızca var olan veriyi doktora açar**.

### B.2 Anonimlik tasarımdan gelir, perdelemeden değil

`DoctorApptDto`'ya `Rating` alanı **eklenmez**. Eklenseydi doktor randevu listesinde *"Ayşe Yılmaz · 2 yıldız"* görürdü — istenen anonimliğin tam tersi. Bunun yerine **tek bir toplu uç** eklenir ve tekil puan doktora hiçbir uçtan verilmez:

**`GET /api/doctor/rating`** → `{ average, count }`

- Kapsam: `Appointments where DoctorId == <benim> && Rating != null`
- `average`: 1 ondalık basamağa yuvarlanır; `count == 0` ise `null`
- `count`: değerlendirme adedi
- Yetki: mevcut `ActiveGuard.Doctor` + `MyDoctorIdAsync(gate, p, ct)` — doktor yalnız kendi kimliğiyle sorgular, parametre almaz, başkasının puanını isteyemez

Puan dağılımı (`1★…5★` adetleri) **döndürülmez**: rozet yalnız ortalama ve adet gösteriyor, dağılımı hiçbir ekran tüketmiyor. Gerekirse tek satırla eklenir.

Kullanıcının "sağ üstte, adının yanında" isteği ile anonimlik gereksinimi aynı çözüme çıkar: özet rozet için zaten yalnız toplu veri gerekir. Ayrı sayfa, ayrı liste, DTO değişikliği gerekmez.

`RatingSummary.From(IEnumerable<int> ratings)` statiği hesabı yapar — DB'siz test edilebilir (bkz. D). `DoctorEndpoints.cs` içinde yaşar, `AdminEndpoints` oradan çağırır (C.1); dosyalar arası statik paylaşımı kod tabanında zaten var — `DoctorEndpoints` da `PatientEndpoints.DisplayStatus`'u böyle kullanıyor.

### B.3 Doktor arayüzü

`frontend/src/pages/doktor/DoktorLayout.tsx` — başlıkta `{user?.doctorName}` **yanına** küçük rozet:

```
★ 4.3 · 12
```

- `Icon name="star"` (mevcut) + amber renk; başlığın koyu zeminine uygun kontrast
- `title`: *"12 değerlendirmenin ortalaması"* — erişilebilirlik için `aria-label` de aynı metin
- `count === 0` ⇒ **rozet hiç render edilmez** (boş "0.0" göstermek yanıltıcı)
- `useQuery({ queryKey: ['doctor','rating'] })`; hata/yükleme hâlinde sessizce gizli — başlık kritik yol, puan rozeti için iskelet gösterilmez

Yeni route yok, yeni sekme yok (kullanıcı kararı).

---

## C. Admin ek kapsamı

Kullanıcı onayladı.

**C.1 — Doktor başına ortalama puan**
`GET /api/admin/doctors` yanıtına `avgRating` (`double?`) + `ratingCount` (`int`). Tek `GroupBy(DoctorId)` sorgusu; `RatingSummary` ile aynı yuvarlama kuralı. `Doctors.tsx` listesinde `★ 4.3 (12)` sütunu; değerlendirme yoksa `–`.
`client.ts` → `Doctor` arayüzüne iki opsiyonel alan (public `/api/doctors` bu alanları döndürmez, opsiyonel olmaları bu yüzden).

**C.2 — Yanıt bekleyen mesaj sayacı**
`OverviewDto`'ya `UnansweredMessages` (`CountAsync(m => m.RepliedAt == null)`). `Overview.tsx`'te mevcut `stat(...)` yardımcısıyla beşinci kart: *"Yanıt bekleyen mesaj"*. Karta tıklama → `/admin/mesajlar`.

---

## D. Testler

`backend.Tests/` — mevcut desen: mantık statik yardımcıya çıkarılır, xUnit ile DbContext'siz test edilir (`DoctorRemovalTests` gibi). İki dosya:

**`ContactReplyTests.cs`** — `ContactMessages.ValidateReply`
- boş / yalnız boşluk yanıt reddedilir
- 2000 karakteri aşan yanıt reddedilir; tam 2000 kabul edilir (sınır)
- `RepliedAt` dolu mesaj reddedilir
- geçerli yanıt `null` döner

**`RatingSummaryTests.cs`** — `RatingSummary.From`
- boş küme → `count 0`, `average null`
- `[5,4]` → ortalama `4.5`
- `[5,4,4]` → `4.3` (yuvarlama; ham değer 4.333…)
- tek eleman `[3]` → `3.0`, `count 1`

CLAUDE.md kuralı: "non-trivial logic leaves ONE runnable check behind". İki hesaplama da önemsiz değil (sınır koşulu + yuvarlama), uçların HTTP/DB kabuğu ise test edilmez.

---

## E. doctick.me'ye çıkış

| Adım | Durum |
|---|---|
| Yeni App Setting | **Yok** |
| Migration adımı | **Yok** — şema açılışta `EnsureSchemaAsync` ile gelir (§A.2) |
| Deploy | `main`'e push → mevcut `.github/workflows/azure-deploy.yml` |
| Geri alma | Önceki deploy'a dön. `ContactMessages` tablosu DB'de kalır; eski kod onu okumaz, zararsızdır. Veri kaybı yok. |

### Deploy sonrası doğrulama

| # | Kontrol | Beklenen |
|---|---|---|
| 1 | Hasta hesabıyla iletişim formundan mesaj gönder | `/admin/mesajlar` listesinde "Yeni" rozetiyle görünür |
| 2 | Admin panelden yanıtla | Hastanın gerçek gelen kutusuna ulaşır; mesaj "Yanıtlandı" olur |
| 3 | `Resend__ApiKey`'i geçici olarak boz, yanıtla | Toast'ta site içi hata mesajı; dialog açık ve metin duruyor; mesaj **"Yeni"** kalıyor |
| 4 | Puan almış bir doktorla giriş yap | Başlıkta `★ ortalama · adet` rozeti; hiç puanı olmayan doktorda rozet **yok** |
| 5 | Admin → Doktorlar | Ortalama puan sütunu dolu; puansız doktorda `–` |
| 6 | Boş commit → redeploy → `/admin/mesajlar` | Mesajlar **duruyor** (`/home/doctick.db` kalıcılığı, `docs/12` §0.2) |

3. ve 6. maddeler atlanmamalı: biri kullanıcının açıkça istediği geri bildirim davranışının, diğeri şema+kalıcılık kararının kanıtıdır.

---

## F. Kapsam dışı

- Konuşma dizisi / çoklu yanıt — tek yanıt modeli (kullanıcı kararı)
- Hastaya panel içinde mesaj/yanıt ekranı — yanıt yalnız e-posta ile ulaşır (kullanıcı kararı)
- Doktora tekil puan gösterimi — yalnız toplu ortalama (anonimlik kararı)
- Puanla birlikte yorum/serbest metin — `Appointment.Rating` yalnız 1–5 tutar, değişmiyor
- Mesajlarda arama, sayfalama, ek dosya
- Yerel geliştirme kurulumu — plan üretimi hedefler

---

## G. Dokunulacak dosyalar

**Backend**
- `backend/Models/Db.cs` — `ContactMessage` varlığı, `DbSet`, `EnsureSchemaAsync` içinde `CREATE TABLE`
- `backend/Endpoints/PublicEndpoints.cs` — `POST /api/contact` sırası tersine
- `backend/Endpoints/AdminEndpoints.cs` — 3 yeni uç, `OverviewDto` + sayaç, `/doctors` yanıtına puan alanları
- `backend/Endpoints/DoctorEndpoints.cs` — `GET /api/doctor/rating`
- `backend/Services/EmailService.cs` — `EmailTemplates.ContactReply`
- Statikler: `ContactMessages.ValidateReply` → `AdminEndpoints.cs`; `RatingSummary.From` → `DoctorEndpoints.cs` (`AdminEndpoints` buradan çağırır). Mevcut `DoctorRemoval` / `PatientEndpoints.DisplayStatus` deseniyle aynı

**Frontend**
- `frontend/src/api/client.ts` — tipler + 5 çağrı
- `frontend/src/pages/admin/Mesajlar.tsx` — **yeni**
- `frontend/src/pages/admin/AdminLayout.tsx` — nav satırı + ikon düzeltmesi
- `frontend/src/router.tsx` — lazy route
- `frontend/src/pages/admin/Overview.tsx` — sayaç kartı
- `frontend/src/pages/admin/Doctors.tsx` — puan sütunu
- `frontend/src/pages/doktor/DoktorLayout.tsx` — puan rozeti

**Test**
- `backend.Tests/ContactReplyTests.cs` — **yeni**
- `backend.Tests/RatingSummaryTests.cs` — **yeni**
