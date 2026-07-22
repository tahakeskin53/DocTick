# 06 — Kimlik Doğrulama & Yetki

DocTick'te kimlik doğrulama **Google OAuth ID-token + sunucu tarafı cookie** modeliyle yapılır. Şifre tutulmaz, oturum veritabanında değil. Gerekçe ve alternatif reddi: [ADR-0002](adr/0002-google-oauth-idtoken-cookie.md).

## Google ile giriş akışı

```mermaid
sequenceDiagram
    participant H as Hasta (tarayıcı)
    participant G as Google Identity
    participant A as ASP.NET (:5080)
    participant DB as SQLite

    H->>G: "Google ile giriş" (GIS butonu)
    G-->>H: credential (ID-token JWT)
    H->>A: POST /api/auth/google { credential }
    A->>G: GoogleJsonWebSignature.ValidateAsync<br/>(audience = Google:ClientId)
    G-->>A: payload { sub, email, name }
    A->>DB: User'ı GoogleSub ile bul ya da oluştur
    Note over A: e-posta Admin maili mi?<br/>evet → Role=Admin, Status=Active<br/>hayır → Role=Patient, Status=Pending
    A-->>H: Set-Cookie: DocTick.Auth (7 gün) + AuthResponse
    H->>A: GET /api/auth/me (cookie)
    A->>DB: güncel kullanıcıyı DB'den oku
    A-->>H: Me { role, status, ... }
```

## Cookie yapılandırması (`Program.cs:21-32`)

| Özellik | Değer | Neden |
|---|---|---|
| `Name` | `DocTick.Auth` | — |
| `HttpOnly` | `true` | JavaScript erişemez (XSS ile çalınmayı engeller) |
| `SameSite` | `Lax` | Vite proxy aynı köken yaptığı için yeterli |
| `SecurePolicy` | `Always` | Her zaman HTTPS bayrağı; localhost secure sayılır |
| `ExpireTimeSpan` | 7 gün | kalıcı oturum |

`OnRedirectToLogin` / `OnRedirectToAccessDenied` override'ları API için yönlendirme yerine **`401`/`403`** döner (`Program.cs:30-31`) — SPA açısından doğru davranış.

## Yetkilendirme — `ActiveGuard` (`Auth/Authz.cs`)

Oturum 7 gün yaşadığı halde, bir kullanıcının rol/statüsü bu süre içinde değişebilir (yönetici onaylar/reddeder, yönetici atar). Claim tabanlı policy'ler **stale** (eski) kalırdı. Bunun yerine iki endpoint filtresi **her istekte DB'yi okur**:

- `ActiveGuard.Patient` — kullanıcı var **ve** `Status == Active`, değilse `403`.
- `ActiveGuard.Admin` — `Role == Admin`, değilse `403`.

```mermaid
flowchart LR
    Req["İstek (cookie)"] --> Auth["UseAuthentication<br/>cookie çöz → uid claim"]
    Auth --> Guard{"ActiveGuard?"}
    Guard -->|Public| DB1[("DB: kullanıcı var?")]
    Guard -->|Patient| DB2[("DB: Status==Active?")]
    Guard -->|Admin| DB3[("DB: Role==Admin?")]
    DB1 -->|evet| OK["endpoint çalışır"]
    DB2 -->|evet| OK
    DB3 -->|evet| OK
    DB1 -->|hayır| F401["401"]
    DB2 -->|hayır| F403["403"]
    DB3 -->|hayır| F403
```

Gerekçe: stale claim problemi. Ayrıntı: [ADR-0004](adr/0004-activeguard-endpoint-filter.md). `CurrentUser.Uid(p)` custom `"uid"` claim'ini okur; claim tipleri `ClaimTypes2` içinde (`uid`, `role`, `status`).

## Yöneticinin otomatik atanması (`AuthEndpoints.cs:37-62`)

`Admin:Email` yapılandırma anahtarı (şu an `tahakeskin06@hotmail.com`) ile eşleşen e-postayla ilk Google girişi:

- **Yeni kullanıcı** → `Role=Admin, Status=Active` olarak oluşturulur.
- **Mevcut kullanıcı** (daha önce hasta olarak girmişse) → satır içinde `Admin/Active`'e yükseltilir.

Bu yüzden veritabanı seed'inde admin satırı yoktur — ilk giriş anında ortaya çıkar. (`Db.cs:161-163`)

## İstemci tarafındaki yansıması

- Her fetch `credentials: 'include'` gönderir (`client.ts:39`).
- `403` yanıtı → `location.reload()` (`client.ts:46`): sayfa yeniden `/api/auth/me` çağırır, `ActiveGuard`'ın yeni kararı uygulanır, rota guard kullanıcıyı doğru yere yönlendirir. Yani yönetici bir kullanıcıyı reddettiğinde, kullanıcının açık oturumu bir sonraki isteğinde `StatusScreen`'e düşer — manuel yenileme gerekmez.

## Güvenlik notları

- Şifre/salt yok — Google'a外包 edilmiş.
- ID-token sunucuda `audience` ile doğrulanır; istemci doğrulamasına güvenilmez.
- `SecurePolicy=Always` + `HttpOnly` + `SameSite=Lax` kombinasyonu.
- **Bilinen sınır (test/demo):** Resend gönderim domaini doğrulanana dek tüm e-posta `Resend:RedirectTo` adresine yönlendirilir — bkz. [ADR-0005](adr/0005-resend-raw-http-redirect-to.md). Üretime almadan önce domain doğrulanmalı.
