# ADR-0003 — Çift-rezervasyon engeli: uygulama kontrolü + partial unique index

**Bağlam:** Aynı doktor+tarih+saat için yalnızca tek Onaylı randevu olmalı; eşzamanlı istekler (race condition) olası. **Karar:** İki katmanlı garanti — (1) endpoint'te uygulama seviyesi çakışma kontrolü, (2) SQLite üzerinde `UNIQUE (DoctorId, Date, Time) WHERE "Status" = 'Confirmed'"` **kısmi (partial)** unique index. İkincisi `SqliteException` (hata 19) olarak yakalanır, `409 Conflict`'a çevrilir.

**Neden partial:** Filtre `Confirmed` üzerinde olduğundan iptal edilen slot **tekrar rezerve edilebilir** — tam unique index bunu engellerdi. Uygulama kontrolü yalnızca kullanıcı deneyimi içindir (erken 409); **sert garanti DB'dedir**, çünkü race'i yalnızca DB kısıtı kapatır. Testi `UnitTest1.cs` (test 1 ve 3) ile doğrulanır.
