# Bugfix Planı — Doktor Paneli

**Tarih:** 2026-07-31
**Bildiren:** kullanıcı (deploy sonrası)
**İlgili spec:** `docs/superpowers/specs/2026-07-31-doktor-rolu-sonuclar-design.md`
**İlgili commit:** `93b10f7` (özelliğin uygulandığı commit)

---

## 1. Bildirilen semptomlar

1. Doktor panelinde **"DOKTOR PANALİ"** yazıyor
2. Sağ üstteki isim **e-postadaki ada** göre geliyor, doktor adına göre olmalı
3. Hasta hesabından randevu alındı, **doktor panelinde görünmüyor**

---

## 2. Teşhis

### 2.1 Semptom 1 — yazım hatası

`frontend/src/pages/doktor/DoktorLayout.tsx:34`

```
<span ...>DOKTOR PANALİ</span>
```

Tek harf. Başka yerde geçmiyor.

### 2.2 Semptom 2 — yanlış isim kaynağı

`frontend/src/pages/doktor/DoktorLayout.tsx:41`

```
<span ...>Dr. {user?.name}</span>
```

`user.name`, `User` tablosundaki Google hesap adı — `Doctor.Name` değil. `Me` arayüzünde
(`client.ts:4-20`) doktor adı hiç taşınmıyor, `/api/auth/me` de göndermiyor
(`AuthEndpoints.cs:110`).

**İkinci, henüz görünmeyen hata aynı satırda:** `Doctor.Name` zaten unvanı içeriyor
("Uzm. Dr. Ayşe Demir", `Db.cs:45`). Doğru isim bağlandığında `Dr. ` öneki
**"Dr. Uzm. Dr. Ayşe Demir"** üretir. Önek de kaldırılmalı.

### 2.3 Semptom 3 — kök neden: doktor API'si hiç yazılmamış

Backend'de `/api/doctor/*` **yok**. `backend/Endpoints/` altında dört dosya var —
`Admin`, `Auth`, `Patient`, `Public` — `DoctorEndpoints.cs` diye bir dosya hiç oluşturulmamış.
`Program.cs:167-169` yalnız üç grup kaydediyor.

`93b10f7` commit'i backend'de sadece 5 dosyaya dokunmuş: rol enum'ı, `ActiveGuard.Doctor`,
veri modelleri, admin uçları, `FileStore`. **Uçlar atlanmış.**

Frontend ise 12 çağrı yapıyor (`client.ts:122-134`) — hiçbirinin sunucu karşılığı yok:

| Frontend çağrısı | Sunucu |
|---|---|
| `GET /api/doctor/appointments` | **yok** |
| `GET /api/doctor/patients` | **yok** |
| `GET /api/doctor/patients/{id}/results` | **yok** |
| `POST/PUT/DELETE /api/doctor/lab` | **yok** |
| `POST/PUT/DELETE /api/doctor/imaging` | **yok** |
| `GET /api/results` | **yok** |
| `GET /api/results/lab/{id}/file` | **yok** |
| `GET /api/results/imaging/{id}/file` | **yok** |
| `GET /api/admin/users/{id}/results` | var (`AdminEndpoints.cs:287`) |

Spec §5'te tanımlanan `ResultsScope` yetki yardımcısı da yazılmamış.

**Yani semptom 3 bir randevu sorgusu hatası değil.** Doktor panelinin ve hastanın
"Sonuçlarım" sayfasının tamamı sunucusuz. Kullanıcı yalnızca ilk fark ettiğini bildirmiş;
Hastalarım, Sonuçlarım ve dosya indirme de aynı şekilde ölü.

### 2.4 Neden hata vermeden boş görünüyor — asıl bulgu

İki masum davranış üst üste binince eksik uç *başarılı boş yanıt* gibi görünüyor:

```
Program.cs:177   app.MapFallbackToFile("index.html")
                 → /api/doctor/appointments hiçbir route'a uymaz,
                   fallback yakalar → 200 OK, content-type: text/html

client.ts:88     return ct.includes('application/json') ? res.json() : (undefined as T)
                 → text/html geldi → hata değil, sessizce undefined
```

Sonuç: **404 yok, konsol hatası yok, toast yok. Sadece boş liste.**

Bu maskeleme düzeltilmezse bundan sonraki her eksik/yanlış yazılmış uç da aynı şekilde
sessizce boş dönecek. Semptom 3'ün asıl dersi bu.

---

## 3. Doğrulama döngüsü (önce bu kurulur)

`scripts/smoke-api.sh` — her ucu curl'ler, **JSON döndüğünü** doğrular:

```sh
# her satır için: HTTP kodu ve content-type yazdır, text/html ise FAIL
for p in /api/doctor/appointments /api/doctor/patients /api/results ; do
  curl -s -o /dev/null -w "%{http_code} %{content_type} $p\n" -b "$COOKIE" "$BASE$p"
done
```

**Şu anki beklenen çıktı (kırmızı):** hepsi `200 text/html` — yani fallback yutuyor.
**Düzeltme sonrası (yeşil):** `200 application/json`.

Bu döngü hem F0'ı hem F3'ü doğrular; saniyeler sürer, ajan tarafından çalıştırılabilir.
Girişli bir çerez gerektiği için kurulumda bir kez `COOKIE` alınır.

---

## 4. Düzeltmeler

Sıra bilinçli: **F0 önce** — o olmadan diğerlerinin düzeldiğini kanıtlayamayız.

### F0 — Eksik API uçları sessiz kalmasın

`backend/Program.cs`, `MapFallbackToFile` kaydından önce:

```csharp
// /api/* SPA fallback'ine düşmesin: eşleşmeyen bir API yolu index.html değil 404 dönmeli.
// Aksi hâlde eksik bir uç, istemciye 200 + text/html olarak ulaşır ve client.ts bunu
// sessizce undefined'a çevirir — hata görünmez, liste boş kalır.
app.Map("/api/{*rest}", () => Results.NotFound());
```

`ponytail:` Tek satır, tek yerde. Her uç için ayrı kontrol yazmıyoruz — eksikliği
yakalayan ortak nokta burası.

**Yan etki uyarısı:** Bu değişiklikten sonra `Api.myResults()` ve doktor çağrıları
`undefined` yerine `ApiError(404)` fırlatacak; F3 bitene kadar ilgili sayfalar hata
gösterecek. Bu istenen davranış — sessiz boşluktan iyidir.

**Kabul:** `scripts/smoke-api.sh` çıktısında `text/html` kalmaz; eksik uçlar `404` olur.

### F1 — Yazım hatası

`DoktorLayout.tsx:34` → `DOKTOR PANALİ` → `DOKTOR PANELİ`

**Kabul:** gözle.

### F2 — Doktor adı

Üç dokunuş:

1. `AuthEndpoints.cs:110` — `/api/auth/me` yanıtına `doctorName` eklenir.
   `User.DoctorId` null değilse ilgili `Doctor.Name`, değilse boş string.
2. `client.ts` — `Me` arayüzüne `doctorName?: string`
3. `DoktorLayout.tsx:41` — `Dr. {user?.name}` → `{user?.doctorName}`

`Dr. ` öneki **kaldırılır** (§2.2): `Doctor.Name` unvanı zaten taşıyor.

**Hesap adına düşülmez.** Kullanıcının Google hesabındaki adı ile bağlandığı doktor kaydının
adı farklı olabilir — bağlayıcı olan `Doctor.Name`'dir. `ActiveGuard.Doctor` zaten
`DoctorId != null` şartını arıyor (`Authz.cs:46`), yani doktor panelindeyken `doctorName`
daima dolu. Boş gelirse bu bir veri tutarsızlığıdır ve hesap adını göstererek maskelenmemeli.

**Kabul:** doktor hesabıyla girildiğinde sağ üstte, hesabın e-postasındaki ada bakılmaksızın,
bağlandığı `Doctor` kaydının tam adı görünür; unvan tekrarlanmaz.

### F3 — Eksik uçları yaz

Spec §5, §6, §7'ye göre. İki yeni dosya:

**`backend/Endpoints/DoctorEndpoints.cs`** — `MapGroup("/api/doctor")` +
`RequireAuthorization()` + `AddEndpointFilter(ActiveGuard.Doctor)`:

- `GET /appointments?date=` — `DoctorId == kendi`. **`date` verilmezse tümü döner**
  (yeni→eski sıralı); verilirse o güne filtrelenir. `PatientEndpoints.ToDto` deseniyle,
  ama aşağıdaki DTO farkıyla (bkz. F4)
- `GET /patients` — kendi randevusu olan hastalar, `DISTINCT`
- `GET /patients/{id}/results` — `ResultsScope` kontrolünden sonra
- `POST /lab`, `PUT /lab/{id}`, `DELETE /lab/{id}`
- `POST /imaging`, `PUT /imaging/{id}`, `DELETE /imaging/{id}`

**`backend/Endpoints/ResultsEndpoints.cs`** — `MapGroup("/api/results")` +
`AddEndpointFilter(ActiveGuard.Patient)`:

- `GET /` — kendi sonuçları
- `GET /lab/{id}/file`, `GET /imaging/{id}/file` — yetki sonra `Results.File(...)`

**`ResultsScope`** (spec §5) — tek yetki predicate'i, üç uç grubunun da çağırdığı:

```csharp
bool CanTouch(int docId, int patientId) =>
    db.Appointments.Any(a => a.DoctorId == docId && a.UserId == patientId);
```

Yazma ayrıca daraltılır: doktor yalnız `DoctorId == kendi` olan kaydı günceller/siler.

`Program.cs:169`'a iki kayıt satırı eklenir.

**Kabul:** `smoke-api.sh` tümünde `application/json`; hasta randevu alınca doktor panelinde
görünür.

---

### F4 — Randevu listesi: tüm randevular + hasta kimliği

Kullanıcı isteği ve teşhis sırasında çıkan iki ek kusur, aynı DTO'ya dokunduğu için birlikte.

#### 4a — Varsayılan "tümü", filtre isteğe bağlı

`DoktorRandevular.tsx:14-15` bugün tarihi state'e koyup **her zaman** gönderiyor:

```
const todayIso = new Date().toISOString().split('T')[0];
const [date, setDate] = useState(todayIso);
```

Backend düzelse bile doktor yalnız bugünü görürdü. Düzeltme:

- `useState('')` — varsayılan boş, yani filtresiz
- `Api.doctorAppointments(date)` zaten boş string'de parametre eklemiyor (`client.ts:126`),
  değişiklik gerekmez
- Tarih kutusunun yanına **"Tümü"** butonu (`setDate('')`)
- Başlık metni (`:104`) ve boş durum metni (`:121`) filtreye göre değişsin —
  "Bu tarihte randevunuz bulunmuyor" filtresizken yanlış ifade

#### 4b — Sonuç yanlış hastaya yazılıyor

`DoktorRandevular.tsx:78` ve `:88`:

```
patientId: activeAppt.id,   // ← randevu Id'si, hasta Id'si DEĞİL
```

Satır 78'deki yorum ("backend reads patient via appointment or direct id") bir varsayım —
o backend yazılmamıştı. `Appointment` DTO'sunda (`client.ts:26-27`) hasta alanı **hiç yok**:
`id, code, doctorId, doctorName, departmentName, date, dateLabel, time, status, rating`.

F3 yazılıp bu hâliyle kaydedilirse her sonuç, randevu Id'si ile aynı numaraya sahip
**rastgele bir hastaya** bağlanır. Tespit edilmesi zor, hasta verisini karıştıran bir hata.

Düzeltme — doktora özel DTO:

```
DoctorApptDto : AppointmentDto + { PatientId, PatientName }
```

- `DoctorEndpoints`'te `/appointments` bu DTO'yu döndürür
- `client.ts`'e `DoctorAppointment` arayüzü, `doctorAppointments` dönüş tipi güncellenir
- `DoktorRandevular.tsx:78,88` → `patientId: activeAppt.patientId`
- Randevu kartı (`:130-133`) hasta adını gösterir — doktorun kimi gördüğünü bilmesi gerekir;
  bugün yalnız randevu kodu ve bölüm yazıyor

`ponytail:` Ayrı bir "hasta getir" ucu eklemiyoruz. Hasta kimliği zaten randevu satırında
duruyor; DTO'ya iki alan eklemek fazladan bir tur atmaktan ucuz.

**Kabul:** doktor panelinde filtresiz tüm randevular listelenir; tarih seçilince o güne
iner, "Tümü" ile geri döner. Her kartta hasta adı görünür. Eklenen sonuç, o randevunun
gerçek hastasına bağlanır.

---

## 5. Regresyon testleri

Spec §11'de tanımlanmış, `93b10f7`'de yazılmamış olanlar — F3 ile birlikte:

| Test | Ne yakalar |
|---|---|
| `backend.Tests/ApiRouteTests.cs` | `/api/olmayan-uc` → **404**, `text/html` değil. F0'ın regresyon kilidi; bu sınıf hatanın tekrar sessizleşmesini engeller |
| `backend.Tests/DoctorAccessTests.cs` | A doktoru B'nin hastasının sonucunu çekemez (403), ortak hastanın başkasınca yüklenmiş kaydını güncelleyemez |
| `backend.Tests/ResultFileTests.cs` | Sonuç dosyası statik yoldan 404, yalnız yetkili uçtan 200 |
| `backend.Tests/DoctorApptTests.cs` | `?date=` yokken tüm randevular döner, varken yalnız o gün; DTO'daki `PatientId` **randevu Id'sinden farklı** bir kayıtta doğru hastayı gösterir (F4b'nin regresyon kilidi — Id'ler çakışırsa test hatayı yakalayamaz, fixture bunu ayırmalı) |

`labFlag.test.ts` zaten var ve geçiyor — tekrar yazılmaz.

**Not:** F1 ve F2 için ayrı test yazılmıyor. F1 tek harflik metin; F2'nin doğru seam'i
`/api/auth/me` yanıtı ve `DoctorAccessTests` kurulumunda zaten doğrulanıyor.

---

## 6. Uygulama sırası

```
F0  → API fallback maskesini kaldır            (1 satır, önce — döngüyü mümkün kılar)
      smoke-api.sh kur, kırmızı olduğunu gör
F1  → yazım hatası                              (1 karakter)
F2  → doktor adı                                (3 dosya)
F3  → DoctorEndpoints + ResultsEndpoints + ResultsScope   (asıl iş)
      smoke-api.sh yeşile döner
F4  → randevu listesi: filtresiz varsayılan + hasta kimliği (F3'ün DTO'suyla birlikte)
R   → dört regresyon testi
```

F4b, F3 ile **aynı anda** yapılmalı: DTO'yu iki kez değiştirmemek için `/appointments`
ucu ilk yazıldığında `PatientId`/`PatientName` ile yazılır.

---

## 7. Post-mortem: bunu ne engellerdi

Frontend'in çağırdığı uçlarla backend'in kaydettiği uçlar hiç karşılaştırılmadan deploy
edildi ve **SPA fallback bu boşluğu 200'e çevirdiği için** ne derleme ne çalışma zamanı
uyardı.

F0 + `ApiRouteTests.cs` bu sınıfı kapatıyor: bundan sonra eksik bir uç, sessiz boş liste
değil gürültülü 404 üretir.

İleride: `smoke-api.sh`'ı `client.ts`'teki yol listesinden üretmek bu kontrolü kalıcı hâle
getirir — ama bugünkü hata için gerekli değil, önce F0 yeter.
