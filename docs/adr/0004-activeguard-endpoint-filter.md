# ADR-0004 — ActiveGuard endpoint filtresi (DB'den rol/statü)

**Bağlam:** Cookie 7 gün yaşar; ama bir kullanıcının rolü/statüsü bu sürede değişebilir (yönetici onaylar/reddeder, yönetici atar). Claim tabanlı policy bu değişikliği yansıtmazdı — stale (eski) kalırdı. **Karar:** Her korumalı uç grubuna bir `ActiveGuard` endpoint filtresi eklenir; filtre **her istekte DB'den** kullanıcının rol/statüsünü okur (`Patient`: Status=Active; `Admin`: Role=Admin), değilse `403`.

**Neden:** Doğruluk > hız. DB okusu istek başına ek maliyet getirir ama "yönetici reddetti → kullanıcı hâlâ erişebiliyor" tutarsızlığını ortadan kaldırır. İstemci tarafı destek: `403` → `location.reload()` → `/api/auth/me` yeniden okunur, rota guard doğru yere yönlendirir. Alternatif (kısa cookie TTL + claim refresh) daha karmaşıktı.
