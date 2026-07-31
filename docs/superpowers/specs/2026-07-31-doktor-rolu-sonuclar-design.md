# DocTick — Doktor Rolü, Tıbbi Sonuçlar, Doktorlarımız, Hakkımızda

**Tarih:** 2026-07-31
**Durum:** Tasarım onaylandı, uygulama planı bekliyor
**Kapsam:** Üçüncü bir kullanıcı rolü (Doktor), tahlil/görüntüleme sonuç yönetimi, doktor tanıtım sayfası, landing'e hakkımızda bölümü, ölçüme dayalı frontend optimizasyonu

---

## 1. Amaç

DocTick bugün iki rol tanıyor: `Patient` ve `Admin`. Doktorlar sistemde yalnızca bir *varlık* (`Doctor` tablosu) — giriş yapamıyor, veri üretemiyorlar. Bu tasarım üç şeyi ekliyor:

1. Doktorların giriş yapabildiği üçüncü bir rol ve kendilerine ait bir ekran
2. Doktorların hastalarına tahlil ve görüntüleme sonucu yükleyebilmesi; hastanın ve admin'in bunları görebilmesi
3. Hastane tanıtımı: landing'de "Hakkımızda" bölümü, giriş sonrası "Doktorlarımız" sayfası (başhekim + özgeçmişler)

Bunlara ek olarak, ölçülmüş bir frontend optimizasyon iş kalemi tanımlanıyor.

---

## 2. Alınan kararlar

| Karar | Seçim | Gerekçe |
|---|---|---|
| Sonuç veri modeli | Hibrit: `LabResult`+`LabValue` ile `ImagingStudy` ayrı | İki tür gerçekten farklı şekilde; tek tabloda yarısı boş kolonlar olurdu |
| Randevu bağı | Opsiyonel (`AppointmentId` nullable) | Randevusuz kontrol tahlili mümkün kalsın |
| Doktor ekranı | Randevularım + Hastalarım + Sonuçlarım | Admin panelinin kırpılmışı değil, ayrı ve dar kabuk |
| CV sahibi | Yalnız admin | Tek yazıcı = tek doğruluk kaynağı, en az yetki yüzeyi |
| Doktor hesabı | Normal Google girişi + admin'in rol değiştirmesi | Mevcut kayıt akışı korunur, ayrı davet mekanizması gerekmez |
| Hasta sonuç görünümü | Tek "Sonuçlarım" sekmesi, içinde alt-sekmeler | Menü 7'ye çıkmasın; randevusuz sonuçlar da görünsün |
| Admin sonuç görünümü | Kullanıcılar sayfasında açılan panel | Ayrı sayfa/route/uç eksilir |
| Hakkımızda | Landing'e bölüm | Giriş yapmamış ziyaretçi de görmeli |
| Hero videosu | Değiştirilmeyecek | Kullanıcı kararı — kalite korunuyor |

---

## 3. Rol modeli ve doktor girişi

### 3.1 Şema

```
UserRole { Patient, Doctor, Admin }        // enum'a üçüncü değer
User.DoctorId  int?                        // Doctor satırına bağ
```

`User.DoctorId` üzerine **filtreli unique indeks** (`WHERE DoctorId IS NOT NULL`): bir doktor kaydına
iki kullanıcı bağlanamaz. Mevcut `Appointment` filtreli indeks deseninin aynısı (`Db.cs:122-131`).

### 3.2 Akış

1. Doktor sıradan Google girişi yapar → `Status=Pending` (mevcut akış, değişmiyor)
2. Admin ▸ Kullanıcılar'da satırı açar → **"Doktor yap"** → henüz bağlanmamış aktif `Doctor` kayıtlarından birini seçer
3. Sonuç: `Role=Doctor, DoctorId=X, Status=Active`
4. Geri alma: **"Hastaya çevir"** → `Role=Patient, DoctorId=null`

### 3.3 Neden claim'e dokunmuyoruz

`ActiveGuard` yetkiyi cookie claim'inden değil, `UserGate` üzerinden **veritabanından** okuyor
(`Authz.cs:26-40`). Rol değişimi yeniden giriş gerektirmez. Rol değiştirme ucu
`UserGate.Invalidate(uid)` çağırmak **zorundadır** — mevcut onay/red uçlarındaki gibi
(`AdminEndpoints.cs:195,208`). Çağrılmazsa değişim 15 saniyeye kadar gecikir (`UserGate.cs`, TTL).

### 3.4 Yeni guard

```
ActiveGuard.Doctor:
    u.Role == Doctor && u.Status == Active && u.DoctorId != null
```

Frontend'de `DoctorGuard` + `/doktor` route ağacı. `HastaGuard`'a Admin satırının kardeşi eklenir
(`router.tsx:28`):

```
if (user.role === 'Doctor') return <Navigate to="/doktor" replace />;
```

### 3.5 Kenar durum: silinen doktor

Admin bir doktoru sildiğinde (`IsDeleted=1`, `AdminEndpoints.cs:93`) o `Doctor` satırına bağlı
kullanıcı da `Patient`'a düşürülür ve `DoctorId=null` yapılır. Aksi hâlde ölü satıra bakan bir
Doctor hesabı kalır ve `ActiveGuard.Doctor` geçerken tüm sorguları boş döner.

---

## 4. Veri modeli

```
LabResult                              ImagingStudy
─────────────────────────────          ─────────────────────────────
Id            int                      Id            int
PatientId     → User                   PatientId     → User
DoctorId      → Doctor                 DoctorId      → Doctor
AppointmentId → Appointment?           AppointmentId → Appointment?
PanelName     "Hemogram"               Modality      Rontgen|MR|BT|USG|Diger
Status        Requested|Reported       BodyPart      "Sol diz"
RequestedAt   DateTime                 Status        Requested|Reported
ReportedAt    DateTime?                RequestedAt   DateTime
DoctorNote    string                   ReportedAt    DateTime?
FilePath      string  (ops. PDF)       ReportText    string
                                       FilePath      string

LabValue
─────────────────────────────
Id            int
LabResultId   → LabResult (cascade)
TestName      "HGB"
Value         double
Unit          "g/dL"
RefLow        double?
RefHigh       double?
```

### 4.1 Durum yaşam döngüsü

`Requested` → `Reported`, tek yön, geri dönüş yok.

- **Requested:** doktor tetkiki ister; henüz değer/rapor yok. `ReportedAt` null.
  Hasta bunu "Sonuç bekleniyor" olarak görür, değer tablosu boş gelir.
- **Reported:** doktor değerleri veya raporu girer. `ReportedAt` set edilir.

Doktor kaydı doğrudan `Reported` olarak da açabilir (sonuç elindeyse tek adım). Yani
`Requested` zorunlu bir ara adım değil, isteğe bağlı bir bekleme durumu.

### 4.2 Türetilmiş alanlar

Normal/yüksek/düşük rozeti **veritabanında tutulmaz** — `Value` ile `RefLow`/`RefHigh`'dan
hesaplanır. Bu, projenin mevcut felsefesi: `Appointment`'ın "Done" durumu da saklanmıyor,
okuma sırasında hesaplanıyor (`Db.cs:9-10`).

```
flag(value, lo, hi) =
    lo != null && value < lo  → 'low'
    hi != null && value > hi  → 'high'
    otherwise                 → 'normal'
```

Sınır değerler dahil normaldir (`value == lo` → normal). Referans aralığı yoksa daima `normal`.

### 4.3 `Doctor` tablosuna eklenenler

```
Bio         TEXT   özgeçmiş paragrafı
Education   TEXT   satır başına bir madde (\n ayraç)
Interests   TEXT   satır başına bir madde (\n ayraç)
IsChief     INT    başhekim bayrağı
```

`ponytail:` Eğitim/ilgi alanları için ayrı tablo yerine newline ayraçlı tek TEXT alan.
Gösterim `.split('\n')` — bir satır. **Tavan:** madde başına yıl/kurum gibi ayrı alan
gerekirse yapılandırılmış tabloya çıkarılır.

`Name` alanı zaten unvanı içeriyor ("Uzm. Dr. Ayşe Demir", `Db.cs:45`) — ayrı `Title` alanı
**eklenmiyor**.

---

## 5. Yetki kuralı

Tüm sonuç erişimi tek bir predicate'e dayanır:

> **Doktor**, yalnızca **kendisiyle randevusu olmuş** hastaların sonuçlarını okur ve yazar.

```csharp
bool CanTouch(int docId, int patientId) =>
    db.Appointments.Any(a => a.DoctorId == docId && a.UserId == patientId);
```

Aynı sorgu "Hastalarım" listesini de üretir — iki ayrı kural yok, biri diğerinin `Any`'si.

| Rol | Görebildiği |
|---|---|
| Hasta | `PatientId == kendi uid` |
| Doktor | `CanTouch(kendi DoctorId, PatientId)` |
| Admin | Hepsi (salt okunur) |

Backend'de `ResultsScope` adında tek yardımcı; üç uç grubu da bunu çağırır. Kural değişirse
tek dosya değişir.

**Yazma yetkisi ayrıca daraltılır:** doktor yalnızca `DoctorId == kendi` olan kayıtları
günceller/siler. Başkasının yüklediği sonucu, hasta ortak olsa bile, değiştiremez.

---

## 6. Dosya depolama ve güvenlik

Doktor fotoğrafları `/uploads/doctors/` altında **herkese açık statik** servis ediliyor
(`Program.cs`, `PhysicalFileProvider`).

**Tahlil ve görüntüleme dosyaları asla böyle servis edilmez.** URL tahmin edilir veya
paylaşılırsa hasta verisi yetkisiz kişiye açılır.

- Dosyalar `photos/` ile kardeş ama **statik olmayan** bir klasöre yazılır (`results/`).
  Hiçbir `UseStaticFiles` çağrısı bu klasörü göstermez.
- İndirme yalnız `GET /api/results/lab/{id}/file` üzerinden: önce bölüm 5'teki yetki
  kontrolü, sonra `Results.File(...)`.
- `PhotoStore` → `FileStore(dir, urlPrefix)` olarak parametrelenir, DI'da iki örnek.
  Magic-byte sniff'ine `%PDF` eklenir (`PhotoStore.cs:15-20` deseni). 5 MB limiti korunur.
  Path traversal koruması zaten yazılmış ve doğru (`PhotoStore.cs:65-91`).

`ponytail:` Yeni depolama sınıfı yazılmıyor; var olan iki parametreyle genelleştiriliyor.

---

## 7. API yüzeyi

```
Doktor  /api/doctor/*                    (ActiveGuard.Doctor)
  GET    /appointments?date=             kendi randevuları
  GET    /patients                       kendi hastaları
  GET    /patients/{id}/results          o hastanın tüm sonuçları
  POST   /lab                            tahlil + değerler (tek gövde)
  POST   /imaging                        görüntüleme
  PUT    /lab/{id} · /imaging/{id}       rapor/değer güncelle (yalnız kendi)
  DELETE /lab/{id} · /imaging/{id}       yalnız kendi

Hasta   /api/results                     (ActiveGuard.Patient)
  GET    /                               kendi sonuçları (lab + imaging tek yanıt)
  GET    /lab/{id}/file
  GET    /imaging/{id}/file

Admin   /api/admin/*                     (ActiveGuard.Admin)
  POST   /users/{id}/role                { role, doctorId? } → UserGate.Invalidate
  GET    /users/{id}/results             panel için, salt okunur
  PUT    /doctors/{id}                   mevcut uca Bio/Education/Interests/IsChief eklenir

Public  /api/doctors                     mevcut uca CV alanları eklenir
```

### 7.1 Arama neden sunucuda değil

`ponytail:` Ne admin üye aramasına ne de doktorun hasta aramasına backend `?q=` parametresi
eklenmiyor. `Api.adminUsers()` zaten listenin tamamını çekiyor (`AdminEndpoints.cs:191`);
arama React tarafında tek `filter()` satırı. Doktorun hasta listesi zaten "kendi hastaları"
ile sınırlı, yani küçük.

**Tavan:** liste binlerce satıra çıkarsa arama sunucuya taşınır ve sayfalama eklenir.

---

## 8. Ekranlar

### 8.1 Hasta — 6 sekme

```
Ana sayfa │ Randevu al │ Randevularım │ Sonuçlarım │ Doktorlarımız │ İletişim
```

| Sekme | Yol | Durum |
|---|---|---|
| Ana sayfa | `/` | Var |
| Randevu al | `/randevu-al` | Var |
| Randevularım | `/randevularim` | Var — "2 tahlil, 1 görüntüleme →" rozeti eklenecek |
| **Sonuçlarım** | `/sonuclarim` | Yeni |
| **Doktorlarımız** | `/doktorlarimiz` | Yeni |
| İletişim | `/iletisim` | Var |

**`/sonuclarim`** — mevcut `Tabs.jsx` ile iki alt sekme:
- *Tahliller*: açılır-kapanır kart (panel adı · tarih · doktor), içinde değer tablosu ve
  ▲yüksek / ▼düşük / ✓normal rozetleri
- *Görüntülemeler*: küçük önizleme + rapor metni + indirme bağlantısı

**`/doktorlarimiz`** — başhekim üstte tam genişlik kartta, altında bölüme göre gruplanmış
doktor kartları. Karta tıklayınca CV modalı açılır (mevcut `ProfileModal.tsx` deseni;
`DoctorAvatar.tsx` zaten var).

**Dar ekran:** 6 etiket ≈ 420 px. `--page-max` içinde masaüstünde sığıyor; ~900 px altında
sekme şeridi `overflow-x: auto` ile yatay kaydırılır. Ayrı hamburger menü yazılmıyor.

### 8.2 Doktor — `/doktor`

`DoctorLayout`, `HastaLayout`'un kardeşi olarak yazılır (admin panelinin kırpılmışı değil).

```
Randevularım │ Hastalarım │ Sonuçlarım
```

- **Randevularım** (index): tarih seçici, o günün randevuları, her satırda "Sonuç ekle"
- **Hastalarım**: kendi hastaları + arama kutusu; hastaya tıkla → sonuç geçmişi + yeni sonuç
- **Sonuçlarım**: yüklediği tüm sonuçlar, tür filtresi

### 8.3 Admin

- **Kullanıcılar**: arama kutusu + "Doktor yap / Hastaya çevir" + satıra tıklayınca açılan
  yan panel (hasta bilgileri + sonuç geçmişi, salt okunur)
- **Doktorlar**: mevcut düzenleme formuna Bio / Education / Interests / IsChief alanları
- Yeni sayfa **yok**

### 8.4 Landing — Hakkımızda

`Login.tsx:275` civarına `<section className="dt-ch" id="dt-ch-hakkimizda">`, mevcut scroll
koreografisine uyumlu. Footer'a çapa link. Yeni route, guard veya API yok.

### 8.5 Paylaşılan bileşen

Hasta kendi sonuçlarını, doktor hastasının sonuçlarını, admin herkesin sonuçlarını **aynı
`ResultsView` bileşeniyle** görür. Fark yalnızca hangi uçtan beslendiği ve `canEdit` bayrağı.
Üç ayrı liste UI'ı yazılmaz.

---

## 9. Şema göçü — bilinen tuzak

`Program.cs` şemayı `db.Database.EnsureCreated()` ile kuruyor. **Bu, veritabanı zaten varsa
hiçbir şey yapmaz.** Mevcut `doctick.db`'ye yeni tablolar kendiliğinden gelmez; sessizce
"no such table" alınır.

Çözüm, projenin kendi desenini izler — `DbSeeder.EnsureSchemaAsync` içinde
(`Db.cs:144-172`):

- Yeni tablolar: `CREATE TABLE IF NOT EXISTS` blokları
- Yeni kolonlar (`Users.DoctorId`, `Doctors.Bio/Education/Interests/IsChief`): mevcut `cols`
  dizisine satır ekleme, `ALTER TABLE ... ADD COLUMN` döngüsü zaten hataları yutuyor
- Yeni filtreli indeks: `CREATE UNIQUE INDEX IF NOT EXISTS`

EF Migrations kurulmuyor — proje bu yolu seçmemiş, tek özellik için altyapı değiştirmek bu
işin kapsamı değil.

---

## 10. Optimizasyon (ölçülmüş)

Ölçüm, 2026-07-31 tarihli `frontend/dist` çıktısı:

```
public/media/doctick-hero.mp4       12 736 981 B   (12,7 MB)
public/media/doctick-hero-9x16.mp4   5 218 809 B   ( 5,2 MB)
dist/assets/index-*.js                 570 220 B   (tek parça, bölünmemiş)
dist/assets/index-*.css                 13 122 B
```

### 10.1 Yapılacaklar

| # | İş | Beklenen kazanç |
|---|---|---|
| O1 | **Poster görseli** — `ScrollVideo` prop'u kabul ediyor (`ScrollVideo.tsx:23`), `Login.tsx:194` geçmiyor. Mevcut `src/assets/hero.png` (13 KB) ilk kareyle uyuşuyorsa yeni dosya üretilmez | İlk boyama: video baytlarını beklemez |
| O2 | **Route bazlı `lazy()`** — admin sayfaları (8 dosya), doktor kabuğu ve landing hastanın ilk yüklemesine girmesin. `Suspense` + mevcut `LayoutSkeleton` | 570 KB → ~180 KB giriş paketi |
| O3 | **`gsap` + `lenis` yalnız landing'de** — yalnız `/login` scroll hikâyesinde kullanılıyorlar; O2'nin doğal sonucu | ~120 KB |

### 10.2 Kapsam dışı — gerekçesiyle

- **Video yeniden kodlama:** kullanıcı kararı, kalite korunacak
- **`preload="none"`:** video scroll ile sarılıyor (`ScrollVideo.tsx:74`); baytlar önden
  inmezse sarma takılır. `preload="auto"` doğru
- **SW precache dışına alma:** video zaten precache manifest'inde değil — Workbox'ın
  2 MiB varsayılan sınırı onu kendiliğinden dışarıda bırakıyor. Yapacak iş yok
- **Backend/cache:** brotli, response compression, immutable asset cache ve `UserGate`
  önbelleği hepsi zaten mevcut ve doğru (`Program.cs`). Yapacak iş yok

---

## 11. Testler

Her mantık parçasına bir çalışabilir kontrol:

1. **`labFlag.test.ts`** — referans aralığı sınırları: tam `RefLow`, tam `RefHigh`, aralık
   yok, tek taraflı aralık. Saf fonksiyon; mevcut vitest deseni (`deleteDoctor.test.ts`)
2. **`DoctorAccessTests.cs`** — A doktoru, B doktorunun hastasının sonucunu çekemez (403) ve
   yazamaz. Ayrıca: doktor, ortak hastanın *başka doktor tarafından* yüklenmiş sonucunu
   güncelleyemez. `DoctorRemovalTests.cs` deseni
3. **`ResultFileTests.cs`** — sonuç dosyası statik yoldan 404; yalnız yetkili API ucundan 200

---

## 12. Uygulama sırası

```
0.  Hakkımızda — landing bölümü               XS, bağımsız, hemen görünür sonuç
O1. Poster görseli                            XS, bağımsız
1.  Doktor rolü + admin rol değiştirme + arama  M, kilit taşı
2.  Doktorlarımız (CV alanları + hasta sayfası) M
3.  Tahliller                                 L
4.  Görüntülemeler + FileStore                M
5.  Randevu rozeti + admin yan paneli         S
O2. Route bazlı kod bölme                     S, EN SON
O3. gsap/lenis ayrımı                         XS, O2'nin sonucu
```

**O2 neden en sonda:** kod bölmesi router'ın son hâline göre yapılır. Şimdi yapılırsa üç yeni
route (doktor kabuğu, sonuçlarım, doktorlarımız) eklenince baştan elden geçirmek gerekir —
iki kez yapılan iş.

---

## 13. Kapsam dışı (bilerek)

DICOM görüntüleyici · reçete/ilaç modülü · doktorun kendi CV'sini düzenlemesi · doktorun kendi
takvimini düzenlemesi (admin'in Saatler sayfasıyla yetki çakışması) · sonuç hazır bildirimi
e-postası · sunucu tarafı PDF üretimi · sonuç sürüm geçmişi · sonuç arama/filtreleme
(liste küçükken gereksiz).
