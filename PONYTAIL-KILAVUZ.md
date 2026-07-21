# 🐴 Ponytail — DocTick Projesi Kurulum ve Yetenek Kılavuzu

> **Kaynak repo:** https://github.com/DietrichGebert/ponytail
> **Sürüm notu:** Bu kılavuz, ponytail reposunun yeteneklerini bu projeye **markdown (instruction-only) yöntemiyle** kurmak için hazırlandı.
> **Lisans:** MIT

Ponytail, AI kodlama ajanını (Claude Code) **"tembel kıdemli geliştirici"** moduna sokan bir kural setidir. Felsefesi tek bir cümle:

> **Yazılmayan en iyi kod, hiç yazılmayan koddur.**

Ajan bir şey yazmadan önce durur ve sorar: *Bunu gerçekten yazmalı mıyım? Yoksa standart kütüphane / platform / zaten kurulu bir bağımlılık bunu hallediyor mu?* Sonuç ölçüldü: ortalama **~%54 daha az kod**, **~%20 daha ucuz**, **~%27 daha hızlı** — güvenlikten ödün vermeden.

---

## 📌 İçindekiler

1. [Bu projede nasıl kuruldu?](#-bu-projede-nasıl-kuruldu)
2. [Ponytail nasıl çalışır? (Merdiven / Ladder)](#-ponytail-nasıl-çalışır-merdiven--ladder)
3. [Yoğunluk seviyeleri (lite / full / ultra)](#-yoğunluk-seviyeleri-lite--full--ultra)
4. [Komutlar ve Skill'ler](#-komutlar-ve-skilller)
5. [Günlük kullanım örnekleri](#-günlük-kullanım-örnekleri)
6. [Before / After (örnekler)](#-before--after-örnekler)
7. [Yapılandırma (varsayılan mod)](#-yapılandırma-varsayılan-mod)
8. [Resmi plugin alternatifi (daha zengin deneyim)](#-resmi-plugin-alternatifi-daha-zengin-deneyim)
9. [Ne zaman tembel OLUNMAZ](#-ne-zaman-tembel-olunmaz)
10. [Devre dışı bırakma / kaldırma](#-devre-dışı-bırakma--kaldırma)
11. [Dosya yapısı özeti](#-dosya-yapısı-özeti)
12. [SSS](#-sss)

---

## 🛠 Bu projede nasıl kuruldu?

Sen Claude Code (CLI) kullandığını belirttin ve **markdown dosyasıyla** kurulum istedin. Bu yüzden ponytail'in kendi **"instruction-only"** yaklaşımını kullandım. Hiçbir plugin komutu çalıştırmana gerek yok — her şey dosya olarak projede:

| Dosya | Görevi |
|-------|--------|
| `CLAUDE.md` | **Her zaman aktif** ponytail kural seti. Claude Code bunu her oturumda otomatik okur → ponytail davranışı varsayılan olarak açık. |
| `.claude/skills/ponytail/SKILL.md` | Tembel modun kendisi (ana skill). |
| `.claude/skills/ponytail-review/SKILL.md` | Mevcut diff'i aşırı mühendislik açısından inceler. |
| `.claude/skills/ponytail-audit/SKILL.md` | Tüm repoyu aşırı mühendislik açısından denetler. |
| `.claude/skills/ponytail-debt/SKILL.md` | `ponytail:` kısayol yorumlarını bir "borç defteri" toplar. |
| `.claude/skills/ponytail-gain/SKILL.md` | Ölçülen etki tablosunu gösterir. |
| `.claude/skills/ponytail-help/SKILL.md` | Hızlı başvuru kartı. |

**Neden bu yöntem?** Markdown yöntemi:
- ✅ Plugin mekanizması gerektirmez, hemen çalışır.
- ✅ Node.js gerekmez (plugin'in lifecycle hook'ları node ister; markdown yöntemi istemez).
- ✅ Projeyi paylaştığında kurallar seninle birlikte gelir (git'e commitlenebilir).
- ✅ Claude Code `CLAUDE.md` ve `.claude/skills/` klasörünü otomatik tanır.

> 💡 **Not:** Bu yöntem, ponytail'in plugin yoluyla sağladığı **status line (durum çubuğu)** ve **her tur otomatik mod-enjeksiyonu** özelliklerini içermez. Bu ikisini de istersen [Resmi plugin alternatifi](#-resmi-plugin-alternatifi-daha-zengin-deneyim) bölümüne bak.

---

## 🧗 Ponytail nasıl çalışır? (Merdiven / Ladder)

Ponytail bir kod yazmadan önce aşağıdaki **merdivenin** ilk tutanığında durur ve orada kalır:

```
1. Buna gerçekten gerek var mı?        → yoksa ATLA (YAGNI)
2. Bu codebase'te zaten var mı?        → yeniden yazma, TEKRAR KULLAN
3. Standart kütüphane yapıyor mu?      → onu kullan
4. Platformun yerleşik özelliği var mı? → onu kullan
5. Kurulu bir bağımlılık çözüyor mu?   → onu kullan
6. Tek satıra sığar mı?                → tek satır yap
7. Ancak o zaman: çalışan en az kod
```

**Önemli:** Merdiven, problemi anladıktan **sonra** çalışır — onun yerine değil. Ajan önce görevi ve ilgili kodu okur, gerçek akışı uçtan uca takip eder, **sonra** tırmanır. Çözüm konusunda tembel, okuma konusunda asla.

---

## 🎚 Yoğunluk seviyeleri (lite / full / ultra)

Modu `/ponytail` komutuyla değiştirirsin. Seviye değiştirilene veya oturum kapanana kadar kalır.

| Seviye | Komut | Ne değişir? |
|--------|-------|-------------|
| **Lite** | `/ponytail lite` | İstenileni yapar, ama daha tembel alternatifi tek satırda söyler. Sen seçersin. |
| **Full** | `/ponytail` | Merdiven tam uygulanır. Stdlib ve yerleşik öncelikli. En kısa diff, en kısa açıklama. **Varsayılan.** |
| **Ultra** | `/ponytail ultra` | YAGNI fanatiği. Eklemeden önce silme. Tek satırlık çözümü verir ve aynı nefeste geri kalan gereksinimi sorgular. |

**Örnek — "Bu API cevapları için bir cache ekle":**
- **lite:** "Cache eklendi. Not: `functools.lru_cache` bunu tek satırda halleder, istersen cache sınıfı yazmaktan kurtulursun."
- **full:** "`@lru_cache(maxsize=1000)` fetch fonksiyonuna. Özel cache sınıfı yazılmadı; lru_cache yetersiz kalınca eklenir."
- **ultra:** "Profilayıcı gerek demedikçe cache yok. Gerekince: `@lru_cache`. El yapımı TTL cache sınıfı, hit oranı düşük bir bug çiftliğidir."

---

## ⚡ Komutlar ve Skill'ler

Claude Code, `.claude/skills/` içindeki skill'leri otomatik tanır. Onları `/komut-adi` ile çağırabilir veya doğrudan ilgili cümleyi yazdığında model otomatik tetikler.

| Komut | Otomatik tetikleyici (örnek) | Ne yapar? |
|-------|------------------------------|-----------|
| `/ponytail [lite\|full\|ultra]` | "be lazy", "lazy mode", "en kısa yol", "yagni", "daha az yap" | Tembel modu açar / seviyeyi ayarlar. Argümansız mevcut seviyeyi söyler. |
| `/ponytail-review` | "aşırı mühendislik var mı", "ne silebiliriz" | Mevcut diff'i **sadece karmaşıklık** açısından inceler; silineceklerin listesini verir (uygulamaz, sadece listeler). |
| `/ponytail-audit` | "bu repoyu denetle", "bloat bul" | Tüm repoyu tarar; silinecek/sadeleştirilecek şeylerin sıralı listesini verir. |
| `/ponytail-debt` | "ponytail ne erteledi", "kısayolları listele" | Koddaki tüm `ponytail:` yorumlarını bir **borç defterine** toplar ki "sonra" kelimesi "asla" olmasın. |
| `/ponytail-gain` | "ponytail ne kazandırıyor", "skor tablosu" | Ölçülen etki tablosunu gösterir (daha az kod, daha az maliyet, daha hız). |
| `/ponytail-help` | "ponytail help", "komutlar neler" | Bu hızlı başvuru kartını gösterir. |

### Etiketler (review/audit çıktısında)

| Etiket | Anlamı |
|--------|--------|
| `delete:` | Ölü kod, kullanılmayan esneklik, spekülatif özellik. Yerine: hiçbir şey. |
| `stdlib:` | Standart kütüphanede zaten var olan bir şey. Fonksiyon adını verir. |
| `native:` | Platformun zaten yaptığı bir iş için yazılmış kod/bağımlılık. Özelliğin adını verir. |
| `yagni:` | Tek implementasyonu olan soyutlama, kimsenin set etmediği config, tek çağırıcısı olan katman. |
| `shrink:` | Aynı mantık, daha az satır. Kısa halini gösterir. |

Çıktı şu metric'le biter: `net: -N lines possible.` Kesilecek bir şey yoksa: `Lean already. Ship.`

---

## 💡 Günlük kullanım örnekleri

```text
# 1) Tembel modu aç (zaten CLAUDE.md sayesinde varsayılan açık, ama seviye değiştirmek için):
/ponytail ultra

# 2) Bir özellik yazdıktan sonra diff'i gereksiz karmaşıklık için incele:
/ponytail-review

# 3) Tüm projeyi bir kez "şişkinlik" açısından tara:
/ponytail-audit

# 4) Koda bıraktığın ponytail kısayollarını listele:
/ponytail-debt

# 5) Komutları hatırla:
/ponytail-help

# 6) Normal moda dön:
/ponytail off        (veya "stop ponytail", "normal mode")
```

Ayrıca **komut yazmadan**, doğal dilde de tetikleyebilirsin:
- *"bunu en sade şekilde yap"*
- *"bu gereksiz karmaşık mı?"*
- *"bu repoda silebileceğim şeyler var mı?"*

---

## 🔭 Before / After (örnekler)

**Sen bir date picker istersin.** Normal ajan: `flatpickr` kurar, wrapper bileşeni yazar, stil dosyası ekler, saat dilimleri üzerine bir tartışma başlatır.

**Ponytail ile:**
```html
<!-- ponytail: browser has one -->
<input type="date">
```

**Diğer tipik örnekler (repo `examples/` klasöründen):**
- 27 satırlık email validator sınıfı → `"@" in email` tek satır
- `moment.js` tek bir format çağrısı için → `Intl.DateTimeFormat` (0 bağımlılık)
- El yapımı deep-clone → `structuredClone()` / stdlib
- Sayı formatlama → `Intl.NumberFormat`
- URL parametreleri → yerleşik `URL`/`URLSearchParams`

---

## ⚙️ Yapılandırma (varsayılan mod)

> ⚠️ **Markdown yönteminde:** `CLAUDE.md` ponytail'i **varsayılan `full` seviyede** her oturumda aktif yapar. Aşağıdaki yapılandırma **plugin kuruluysa** status line / mode-tracker ile etkileşim içindir; markdown yönteminde seviye `/ponytail` komutuyla ayarlanır.

**Çevre değişkeni (en yüksek öncelik):**
```bash
export PONYTAIL_DEFAULT_MODE=ultra
```
PowerShell (Windows):
```powershell
$env:PONYTAIL_DEFAULT_MODE = "ultra"
```

**Config dosyası** (`%APPDATA%\ponytail\config.json` — Windows):
```json
{ "defaultMode": "lite" }
```
`"off"` ayarı, oturum başında otomatik aktivasyonu kapatır; isteyince `/ponytail` ile elle açılır.

Öncelik: çevre değişkeni > config dosyası > `full`.

---

## 🚀 Resmi plugin alternatifi (daha zengin deneyim)

Markdown yöntemi tembel modu çalıştırır, ama ponytail'in **tam potansiyeli** plugin yoluyla gelir: her turda otomatik kural enjeksiyonu, status line'da mevcut mod, otomatik güncelleme. İstersen Claude Code'da iki komut yazarak (iki ayrı prompt) kurabilirsin:

```
/plugin marketplace add DietrichGebert/ponytail
```
```
/plugin install ponytail@ponytail
```

> ⚠️ **İki ayrı prompt olarak gönder** — tek mesajda olursa çalışmaz.
> Plugin, `node`'un PATH üzerinde olmasını ister (hook'lar Node.js çalıştırır).

**Plugin ile markdown yöntemi çakışır mı?** Hayır. Ama ikisini birden kullanmak gereksiz yük. Birini seç:
- **Plugin:** en zengin deneyim (status line + her-tur enjeksiyon + otomatik güncelleme).
- **Markdown (bu proje):** plugin'siz, Node gerektirmez, git'le taşınır, her zaman `full`.

Plugin'i kurarsan ve markdown dosyalarını kaldırmak istersen → [Devre dışı bırakma](#-devre-dışı-bırakma--kaldırma).

---

## 🛑 Ne zaman tembel OLUNMAZ

Ponytail **asla** şu konularda kısaltma yapmaz:
- Güven sınırında (trust boundary) **girdi doğrulama**
- Veri kaybını önleyen **hata yönetimi**
- **Güvenlik** önlemleri
- **Erişilebilirlik** temelleri
- Açıkça **istenmiş** her şey (ısrar edersen tam versiyonu yazar, tekrar tartışmaz)
- **Problemi anlamak** (merdiven çözümü kısaltır, okumayı asla)

Ayrıca: önemsiz olmayan her mantık (bir dal, bir döngü, bir parser, para/güvenlik yolu) arkasında **tek bir çalıştırılabilir kontrol** bırakır — bozulursa en küçük başarısız olan şey: bir `assert` tabanlı `demo()`/`__main__` self-check veya tek küçük bir `test_*` dosyası. (Kullanıcı test istisnası: trivial tek satırlıklar test gerektirmez.)

---

## 🧹 Devre dışı bırakma / kaldırma

**Geçici olarak kapat (aynı oturumda):**
```text
/ponytail off
```
veya doğal dilde: *"stop ponytail"*, *"normal mode"*.

**Bu projeden tamamen kaldır (markdown yöntemi):**
Aşağıdaki dosya/klasörleri sil:
- `CLAUDE.md` *( dikkat: DocTick'e özel proje notlarını başka yere taşı veya bu dosyayı silmeden ponytail bölümünü çıkar)*
- `.claude/skills/ponytail/`
- `.claude/skills/ponytail-review/`
- `.claude/skills/ponytail-audit/`
- `.claude/skills/ponytail-debt/`
- `.claude/skills/ponytail-gain/`
- `.claude/skills/ponytail-help/`
- `PONYTAIL-KILAVUZ.md` (bu dosya)

**Plugin kurduysan:**
```
/plugin remove ponytail
```
(plugin dışı bıraktığı state dosyaları için: ponytail klonunda `node scripts/uninstall.js`)

---

## 📂 Dosya yapısı özeti

```
DocTick/
├── CLAUDE.md                         # Her zaman aktif ponytail kuralları + proje notları
├── PONYTAIL-KILAVUZ.md               # Bu kılavuz (tüm yetenekler)
└── .claude/
    └── skills/
        ├── ponytail/SKILL.md         # /ponytail — tembel mod
        ├── ponytail-review/SKILL.md  # /ponytail-review — diff incelemesi
        ├── ponytail-audit/SKILL.md   # /ponytail-audit — repo denetimi
        ├── ponytail-debt/SKILL.md    # /ponytail-debt — borç defteri
        ├── ponytail-gain/SKILL.md    # /ponytail-gain — etki tablosu
        └── ponytail-help/SKILL.md    # /ponytail-help — hızlı kart
```

---

## ❓ SSS

**Ponytail superpowers / TDD gibi diğer skill sistemleriyle çakışır mı?**
Hayır. Ponytail *ne yazılacağını* yönetir (en az kod), diğer skill'ler *nasıl yaklaşılacağını* (test, beyin fırtınası). Birlikte çalışırlar. Kullanıcı talimatı her zaman önceliklidir.

**Buna gerçekten ihtiyacım olan 120 satırlık cache sınıfı varsa?**
Olabilir. Israr edersen onu yazar — yavaşça, doğruca, sana bakarak.

**CLAUDE.md'deki ponytail bölümünü proje notlarımın altına alabilir miyim?**
Evet. `CLAUDE.md` içinde sıralama senin elinde. Önemli olan ponytail kural metninin dosyada kalması.

**Markdown yönteminde `/ponytail` komutları çalışır mı?**
Evet. Claude Code `.claude/skills/` içindeki skill'leri `/skill-adi` sözdizimiyle çağırabilir ve doğal dilde otomatik tetikler.

**Daha fazla gerçek örnek nerede?**
Repo: https://github.com/DietrichGebert/ponytail → `examples/` klasörü (debounce, deep-clone, email-validation, rate-limit, react-countdown vb.).

---

*Kaynak: DietrichGebert/ponytail (MIT) — bu kılavuz yetenekleri DocTick projesi için markdown yöntemiyle uyarlar.*
