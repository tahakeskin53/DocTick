# DocTick — Test Sürümü

Hastane online randevu sistemi. Bu paket **çift tıkla çalışır** — yönetici yetkisine veya Node/npm'e gerek yok (frontend önceden derlenmiş halde paketlenmiştir).

## Nasıl çalıştırılır?

ZIP'i çıkar → **kendi işletim sisteminin klasörüne gir → içindeki tek dosyaya çift tıkla:**

| İşletim Sistemi | Klasör | Çift tıklanacak dosya |
|---|---|---|
| 🪟 **Windows** | `windows/` | **`DocTick_App.bat`** |
| 🍎 **macOS** | `mac/` | **`baslatMAC.command`** |

### 🪟 Windows
`windows/DocTick_App.bat` → **çift tıkla**. Siyah pencere açılır; .NET 10 yoksa **bir kez** otomatik kurulur (yönetici yetkisi istemez), sonra uygulama tarayıcıda açılır: **http://localhost:5080**

### 🍎 macOS
`mac/baslatMAC.command` → **sağ tıkla → Aç** (ilk seferde güvenlik uyarısı çıkarsa tekrar "Aç"). .NET 10 yoksa otomatik kurulur, sonra tarayıcıda açılır: **http://localhost:5080**

## Giriş
Uygulama açılınca **"Google ile giriş yap"**. Test sürümünde **her hesap anında onaylıdır** (onay beklenmez); hemen randevu alabilirsin. Hiçbir anahtar gerekmez — Google Client ID paketle gelir.

> İlk açılışta .NET indirildiği için 1–2 dakika bekleyebilir. Sonraki açılışlar hızlıdır.
> Durdurmak için açılan pencereyi (Windows: "DocTick App" siyah penceresi / Mac: Terminal) kapat.

---

> ℹ️ Bu, DocTick **ana projesinden bağımsız** ayrı bir test deposudur. Teste özel ayarlar (otomatik onay, yöneticisiz .NET kurulumu, önceden derlenmiş frontend) **yalnızca burada** geçerlidir; ana projeyi etkilemez. Teknik dökümantasyon için her klasördeki `docs/`'e bakın.
