# ADR-0001 — Minimal API + SQLite, EnsureCreated (migration yok)

**Bağlam:** Staj projesi tek makinede/demoda çalışacak; küçük ölçek, düşük operasyonel yük. **Karar:** ASP.NET Core Minimal API (controller yok) + EF Core SQLite sağlayıcısı + şema için `Database.EnsureCreated()` (EF migration değil). **Neden:** Minimal API en az dosyayla HTTP yüzeyi verir; SQLite tek dosyadır (kurulum yok); `EnsureCreated` modeli birebir şemaya çevirir — migration altyapısının getirdiği dosya/komut yükü olmadan hızlı başlangıç.

**Sonuçlar:** Model sabitleşince migration'a geçmek gerekir (`EnsureCreated` şema değişikliklerini taşımaz). İş mantığı ince endpoint'lerde yoğunlaştırıldı; ayrı bir servis/repository katmanı yok (YAGNI). Üretim ölçeğinde PostgreSQL'e geçiş düşük maliyetlidir (sağlayıcı EF Core).
