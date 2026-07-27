# ADR-0005 — Resend raw HTTP (SDK yok) + RedirectTo test köprüsü

**Bağlam:** E-posta göndermek gerekli; Resend kullanılıyor ama gönderim domaini henüz doğrulanmamış. **Karar:** Resend REST API'sine **resmi SDK yerine** raw `HttpClient` (named client `"resend"`, `Bearer` token) ile tek JSON POST. Ek olarak `EmailOptions.RedirectTo`: ayarlıysa **tüm** e-posta bu adrese yönlendirilir (orijinal alıcı konuya eklenir).

**Neden:** Raw HTTP — tek endpoint, üç alan (`from/to/subject/html`), SDK bağımlılığı yok (ponytail: kurulmuş olandan kaçın). `RedirectTo` — doğrulanmamış domainde `onboarding@resend.dev` test göndericisi yalnız sahibin mailine atar; bu köprü, geliştirmede gerçek akışı domain doğrulamadan denemeyi sağlar. `ApiKey` boşsa sessiz no-op (dev-dostu). Domain doğrulununca `RedirectTo` kaldırılır.
