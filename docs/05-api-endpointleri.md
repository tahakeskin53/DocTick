# 05 — API Endpoint'leri

Tüm uçlar `/api` altında. Geliştirmede Vite proxy bunları `localhost:5080`'a taşır. Yanıtlar JSON; başarıyla kayıt `200/201`, silme `204`, doğrulama hatası `400`, yetkisiz `401`, yasak `403`, çakışma `409`'dur. Geliştirme ortamında interaktif dokümantasyon: `http://localhost:5080/scalar`.

Kimlik doğrulama her istekte **cookie** (`DocTick.Auth`) ile. Yetki, `ActiveGuard` filtreleriyle **her istekte DB'den** kontrol edilir — [06](06-kimlik-dogrulama.md).

## Auth — `/api/auth` (`AuthEndpoints.cs`)

| Method | Route | Auth | Davranış |
|---|---|---|---|
| POST | `/api/auth/google` | — | Body: `{ credential }` (Google ID-token JWT). Token'ı doğrular (`Google:ClientId` audience), kullanıcıyı `GoogleSub` ile bul/oluşturur. E-posta `Admin:Email` ile eşleşirse `Admin/Active`, değilse `Patient/Pending`. Cookie basar (7 gün). Yanıt: `AuthResponse{Id, Email, Name, Role, Status}`. |
| GET | `/api/auth/me` | cookie | Güncel kullanıcıyı **DB'den** döner (claim değil) — rol/statü değişikliği anında görünür. |
| POST | `/api/auth/logout` | cookie | Cookie'yi siler. |

## Public — `/api` (`PublicEndpoints.cs`) — cookie zorunlu

| Method | Route | Davranış |
|---|---|---|
| GET | `/api/departments?active=true` | Bölümleri listeler; opsiyonel aktif filtresi, isme göre sıralı. `DepartmentDto[]`. |
| GET | `/api/doctors?deptId=&active=` | Doktorları bölüm adıyla listeler; opsiyonel filtreler. `DoctorDto[]` (photoUrl dahil). |
| GET | `/api/availability?doctorId=&date=yyyy-MM-dd` | O doktor/tarih için müsait `"HH:mm"` saatleri: açık slotlar − onaylı randevular (bugün için geçmiş saatler hariç). |
| POST | `/api/contact` | Body: `{ subject(1-150), message(1-2000) }`. Metni HTML-encode eder, `EmailService` ile `Admin:Email`'a gönderir. Gönderim başarısızsa `502`. |

## Patient — `/api/appointments` (`PatientEndpoints.cs`) — cookie + `ActiveGuard.Patient` (Status=Active)

| Method | Route | Davranış |
|---|---|---|
| GET | `/api/appointments/` | Çağıranın randevuları, en yeniden eskiye. Her biri için türetilmiş `status` (`confirmed`/`cancelled`/`done`). |
| POST | `/api/appointments/` | Body: `{ doctorId, date, time }`. Tarih biçimi, slot üyeliği, gelecek datetime, slotun açıklığı, çakışan onaylı randevu yokluğu doğrulanır. **Transaction** içinde: kaydet → `Code` ata → kaydet. Partial index çakışması `SqliteException` 19 ise `409`. En-iyi-effort onay e-postası. |
| POST | `/api/appointments/{id}/cancel` | Durumu `Cancelled`. En-iyi-effort iptal e-postası. |
| POST | `/api/appointments/{id}/rating` | Body: `{ stars(1-5) }`. Yalnızca `Confirmed` ve başlangıç zamanı geçmiş randevularda. |

## Admin — `/api/admin` (`AdminEndpoints.cs`) — cookie + `ActiveGuard.Admin` (Role=Admin)

| Method | Route | Davranış |
|---|---|---|
| GET | `/api/admin/departments` | Bölümler + doktor sayıları. |
| POST | `/api/admin/departments` | Body: `{ name, isActive }`. `201`. |
| PUT | `/api/admin/departments/{id}` | Güncelle. |
| DELETE | `/api/admin/departments/{id}` | Üzerinde doktor varsa `409`; yoksa `204`. |
| GET | `/api/admin/doctors` | Doktorlar + bölüm adları (photoUrl dahil). |
| POST | `/api/admin/doctors` | Body: `{ name, departmentId, isActive }`. Varsayılan haftalık slot ızgarası otomatik oluşturulur. |
| PUT | `/api/admin/doctors/{id}` | Güncelle. |
| DELETE | `/api/admin/doctors/{id}` | Randevu geçmişi varsa `409`; yoksa `204`. |
| PUT | `/api/admin/doctors/{id}/photo` | Body: `{ dataUrl, url }`. Profil fotoğrafı kaydeder (dataUrl Base64 veya hazır galeri url'i), eski dosyayı siler. |
| DELETE | `/api/admin/doctors/{id}/photo` | Profil fotoğrafını sıfırlar ve diskteki dosyayı temizler. |
| GET | `/api/admin/schedule?doctorId=` | `ScheduleGrid{DoctorId, ScheduleCell[](DayOfWeek, Time, IsOpen)}` — tam 7×10 ızgara. |
| PUT | `/api/admin/schedule?doctorId=` | Tümünü değiştir: mevcut slotları sil, gönderilen ızgarayı (geçerli gün/saatlere filtrelenmiş) ekler. |
| GET | `/api/admin/users` | Tüm kullanıcılar `UserDto[]`, en yeniden eskiye. |
| POST | `/api/admin/users/{id}/approve` | Status=Active. En-iyi-effort "onaylandı" e-postası. |
| POST | `/api/admin/users/{id}/reject` | Status=Rejected. En-iyi-effort "reddedildi" e-postası. |
| DELETE | `/api/admin/users/{id}` | Yönetici kendini silemez (`AdminEndpoints.cs:153`). Randevularını sonra kullanıcıyı siler. |
| GET | `/api/admin/overview` | `OverviewDto{WeekAppointments, OpenDepartments, ActiveDoctors, PendingUsers, TodayList}`. Hafta pazartesi tabanlı. |
| GET | `/api/admin/appointments?date=` | Tüm (veya tarih filtreli) randevular; doktor/bölüm/kullanıcı join'li. |
| GET | `/api/admin/settings` | `SettingsDto{ReminderEnabled, ReminderHoursBefore}`. |
| PUT | `/api/admin/settings` | Günceller; `ReminderHoursBefore` 1..168 aralığına kıstırır. |

Kök: `GET /` → `"DocTick API çalışıyor. /scalar üzerinden belgelere bakın."`

## Hata modeli

Standart HTTP durum kodları + Türkçe düz metin gövde. Özel hata sınıfı yok; endpoint'ler `Results.BadRequest("mesaj")`, `Results.Conflict(...)`, `Results.Forbid()` kullanır. Frontend `client.ts` bunları `ApiError{status, message}`'a çevirir — [08](08-frontend.md).
