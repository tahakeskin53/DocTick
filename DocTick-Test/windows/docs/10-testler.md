# 10 — Testler

Yer: `backend.Tests/UnitTest1.cs`. xUnit, **in-memory SQLite**.

## Neden EF InMemory değil, gerçek SQLite?

EF Core'un `UseInMemoryDatabase`'i **unique indeksleri uygulamaz** — yani bu projenin en kritik kuralı (çift-rezervasyon engeli, partial unique index) orada test edilemez. Bu yüzden paylaşılan, açık tutulan bir bağlantı üzerinde gerçek SQLite kullanılır (`UnitTest1.cs:8-9`). Bu, testlerin DB kısıtlarını birebi doğrulamasını sağlar.

## Test senaryoları (7)

### `DbTests`

| # | Test | Doğruladığı |
|---|---|---|
| 1 | `Index_IsPartial_OnConfirmedOnly` | `sqlite_master`'dan Appointments indeks SQL'ini sorgular; `WHERE ... Status` partial koşulu içerdiğini onaylar. |
| 2 | `Availability_ExcludesAlreadyBookedSlot` | 09:30'a Confirmed eklenince; müsait listede 09:30 yok, 09:00 ve 10:00 var. |
| 3 | `UniqueIndex_PreventsDoubleBooking_ButAllowsRebookingCancelled` | Aynı slota 2. Confirmed → `DbUpdateException`; Cancelled sonra Confirmed → izinli (partial index davranışı). |

### `SlotsTests`

| # | Test | Doğruladığı |
|---|---|---|
| 4 | `Days_IncludeWeekend_ButDefaultOpenDoesNot` | `Slots.Days` Cmt(6)/Paz(0) içerir; `DefaultOpenDays` içermez; Pzt-Cum(1-5) içerir. |

### `ReminderWindowTests`

| # | Test | Doğruladığı |
|---|---|---|
| 5 | `IsDue_TrueWhenWithinWindow` | pencere içinde (ve tam 24 saat) `true`. |
| 6 | `IsDue_FalseWhenPastOrBeyondWindow` | geçmiş, pencere dışı ve tam şu an `false`. |
| 7 | `FormatDate_ProducesTurkishLabel` | `"2026-07-24"` → `"24 Tem 2026, Cum"` (`tr-TR`). |

## Çalıştırma

```bash
cd backend.Tests
dotnet test
```

## Test kapsamı notu

Mevcut testler **kritik iş mantığına** odaklanmıştır: çift-rezervasyon garantisi, müsaitlik hesabı, hatırlatma penceresi. HTTP endpoint'leri için entegrasyon testi yoktur (endpoint'ler ince tutulup iş mantığı bu saf yardımcılarda — `ReminderWindow`, `Slots`, DB indeksleri — yoğunlaştırıldığı için bu kapsamın yüksek getirisi vardır). İstemci tarafında test kurulumu yoktur.
