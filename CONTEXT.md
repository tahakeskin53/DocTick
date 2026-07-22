# DocTick

Hastaneler ve klinikler için online randevu sistemi: hastalar bölüm/doktor seçip müsait bir slota randevu alır; yöneticiler kullanıcıları, doktorları ve çalışma saatlerini yönetir. Bu dosya yalnızca **alan sözlüğüdür** (ubiquitous language) — uygulama detayları `docs/` klasöründedir, burada değil.

## Dil

**Randevu (Appointment)**:
Bir hastanın belirli bir doktor için, belirli bir tarih ve slota aldığı rezervasyon.
_Avoid_: rezervasyon, görüşme, oturum

**Slot (ScheduleSlot)**:
Bir doktorun haftalık müsaitlik ızgarasındaki bir hücre — (haftanın günü, saat) çifti ve açık/kapalı bayrağı.
_Avoid_: saat, zaman dilimi, takvim

**Müsaitlik (Availability)**:
Belirli bir tarihte bir doktor için açık slotlardan, o gün zaten onaylı randevuların düşülmesiyle elde edilen saat listesi. Okuma anında hesaplanır, saklanmaz.

**Bölüm (Department)**:
Doktorları gruplandıran klinik birim (Kardiyoloji, Dermatoloji, …). Aktif/pasif bayrağı vardır.
_Avoid_: klinik, servis

**Doktor (Doctor)**:
Bir bölüme bağlı, haftalık çalışma planı olan sağlık çalışanı. Adı unvanı içerir ("Uzm. Dr. Ayşe Demir").

**Kullanıcı (User)**:
Google ile doğrulanmış hesap. Bir Rolü (Hasta/Yönetici) ve bir Statüsü (Beklemede/Aktif/Reddedildi) vardır.
_Avoid_: üye, kayıt

**Hasta (Patient)**:
Rolü Hasta ve Statüsü Aktif olan Kullanıcı — randevu alabilen tek roldür. Beklemede/Reddedildi hastalar kullanıcı olarak var olur ama işlem yapamaz.
_Avoid_: müşteri, ziyaretçi

**Yönetici (Admin)**:
Rolü Yönetici olan Kullanıcı. Yapılandırılan `Admin:Email` ile ilk giriş yapıldığında otomatik atanır.
_Avoid_: süper kullanıcı, moderatör

**Statü (UserStatus)**:
Bir kullanıcının onay durumu: Beklemede (onay bekliyor), Aktif (işlem yapabilir), Reddedildi (engelli).
_Avoid_: durum (bu terim randevu için ayrılmıştır)

**Durum (ApptStatus)**:
Bir randevunun kalıcı durumu: Onaylı (Confirmed) veya İptal (Cancelled). Veritabanında saklanır.
_Avoid_: statü

**Tamamlandı (Done)**:
Tarihi+saati geçmiş bir Onaylı randevunun türetilmiş görünümü. Saklanmaz; okuma anında `DateTime.Now` ile hesaplanır.
_Avoid_: geçmiş, bitmiş

**Randevu Kodu**:
Her randevuya, oluşturma işlemi (transaction) içinde atanan deterministik kimlik: `RND-{yıl}-{id:D4}` (örn. `RND-2026-0007`).

**Hatırlatma (Reminder)**:
Bir onaylı randevunun başlangıcından yapılandırılabilir bir süre (varsayılan 24 saat) önce, `ReminderService` tarafından **bir kez** gönderilen e-posta.

**Çift Rezervasyon Engeli**:
Aynı (doktor, tarih, saat) üçlüsü için en fazla bir Onaylı randevu olabileceği garantisi. Uygulama seviyesi kontrolü + SQLite kısmi (partial) unique indeks ile **katmanlı** sağlanır. İptal edilen slot tekrar rezerve edilebilir.
