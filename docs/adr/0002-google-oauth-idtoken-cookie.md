# ADR-0002 — Google OAuth ID-token + sunucu tarafı cookie

**Bağlam:** Kullanıcıların kimliği doğrulanmalı; şifre yönetimi (hash, sıfırlama, MFA) yükü istenmiyor. **Karar:** İstemci Google Identity Services'dan ID-token (JWT) alır, `POST /api/auth/google`'a gönderir; sunucu `GoogleJsonWebSignature.ValidateAsync` ile (audience = `Google:ClientId`) doğrular, kullanıcıyı bul/oluştur ve kalıcı bir ASP.NET Core cookie (`DocTick.Auth`, 7 gün) basar. Oturum DB'de değil.

**Düşünülen alternatifler:** (a) JWT taşıyıcı token — stateless ama reddetme/rol değişikliği anında zor; (b) yerel şifre — hash/sıfılma yükü ve güvenlik yüzeyi. Reddedildi: cookie, `ActiveGuard` ile her istekte DB kontrolüne olanak tanır (ADR-0004); yerel şifre gereksizdi.
