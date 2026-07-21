# 🎨 Impeccable — DocTick Projesi Tasarım Yetenekleri Kılavuzu

> **Kaynak repo:** https://github.com/pbakaus/impeccable
> **Resmi site:** https://impeccable.style
> **Sürüm:** 3.9.1 (yüklü) · **Lisans:** Apache 2.0
> **Kurulum yöntemi:** CLI installer (`npx impeccable install`) — proje-scope, Claude sağlayıcısı.

Impeccable, AI kodlama ajanının **frontend tasarım kalitesini** yükselten bir tasarım dilidir. Anthropic'in `frontend-design` skill'inden doğdu, ama onu çok aşar: **1 skill, 23 komut, 46 deterministik detector kuralı, canlı tarayıcı iterasyonu** ve UI dosyası düzenlemelerinde otomatik çalışan bir **tasarım hook'u**.

> **Tek cümleyle:** Ponytail *ne kod yazılacağını* kısaltır (en az kod), Impeccable *yazılan frontend kodunun ne kadar kaliteli göründüğünü* garanti eder. Birlikte çalışırlar, çakışmazlar.

---

## 📌 İçindekiler

1. [Bu projede nasıl kuruldu?](#-bu-projede-nasıl-kuruldu)
2. [Nasıl çalışır? (Tek skill, 23 komut)](#-nasıl-çalışır-tek-skill-23-komut)
3. [23 Komutun tamamı](#-23-komutun-tamamı)
4. [Yerleşik tasarım rehberliği](#-yerleşik-tasarım-rehberliği)
5. [Mutlak yasaklar (AI slop / yapay zeka izi)](#-mutlak-yasaklar-ai-slop--yapay-zeka-izi)
6. [Otomatik tasarım hook'u](#-otomatik-tasarım-hooku)
7. [Günlük kullanım örnekleri](#-günlük-kullanım-örnekleri)
8. [Register: Brand mı, Product mı?](#-register-brand-mi-product-mi)
9. [Ponytail ile ilişkisi](#-ponytail-ile-iliskisi)
10. [Dosya yapısı](#-dosya-yapısı)
11. [Yönetim: pin / hooks](#-yönetim-pin--hooks)
12. [Sırada ne var? (`/impeccable init`)](#-sırada-ne-var-impeccable-init)
13. [Güncelleme / kaldırma](#-güncelleme--kaldırma)
14. [SSS](#-sss)

---

## 🛠 Bu projede nasıl kuruldu?

Kurulum, resmi CLI installer ile yapıldı (en standart yol):

```bash
npx --yes impeccable@latest install --providers=claude --scope=project
```

Bu komut şunları kurdu:

| Hedef | İçerik |
|-------|--------|
| `.claude/skills/impeccable/SKILL.md` | Ana skill — 23 komut + tasarım rehberliği. `/impeccable` ile çağrılır. |
| `.claude/skills/impeccable/reference/` | 34 rehber dosyası: her komut için akış + register (brand/product) + platform (ios/android). |
| `.claude/skills/impeccable/scripts/` | Hook, detector (46 kural), canlı tarayıcı sunucusu, palet üreteci, pin. |
| `.claude/settings.local.json` | `PostToolUse` hook'u: UI dosyasında Edit/Write/MultiEdit sonrası detector otomatik çalışır. |

> **Neden CLI yöntemi?** Plugin mekanizması gerektirmez, resmi olarak desteklenen yoldur, hook'u otomatik kurar, ve `npx impeccable update` ile tek komut güncellenir. Ponytail'in "tekerleği yeniden icat etme" kuralına birebir uyar.

> **Not:** `.claude/settings.local.json` machine-local olduğu için `.gitignore`'a eklendi. Fresh clone'da hook'u geri yüklemek için `npx impeccable install` yeniden çalıştırılır. Skill dosyaları (`.claude/skills/impeccable/`) commitlenir, seninle birlikte gelir.

---

## 🧭 Nasıl çalışır? (Tek skill, 23 komut)

Impeccable **tek bir** skill olarak çalışır — `/impeccable`. Tüm komutlar bu skill üzerinden çağrılır:

```
/impeccable <komut> [hedef]
```

Örnekler:
```
/impeccable audit blog              # blog sayfalarını teknik olarak denetle
/impeccable critique landing        # landing sayfası UX incelemesi
/impeccable polish settings         # ayarlar sayfasını ship'e hazır hale getir
/impeccable harden checkout         # ödeme akışına error handling + edge case ekle
```

Argümansız `/impeccable` yazarsan, skill proje bağlamına göre **en değerli 2-3 komutu** önerir (statik bir menü değil, context-aware).

Komutu yazmak yerine **doğal dil** de çalışır — intent'i komuta eşler:
- *"renkler çok cansız"* → `colorize`
- *"aralıkları düzelt"* → `layout`
- *"bu hata mesajını yeniden yaz"* → `clarify`

---

## 🗂 23 Komutun tamamı

Komutlar 6 kategoriye ayrılır:

### 🏗 Build (sıfırdan kur / bağlam topla)

| Komut | Ne yapar? |
|-------|-----------|
| `/impeccable init` | **Tek seferlik kurulum.** Ürün bağlamını toplar, `PRODUCT.md` ve `DESIGN.md` yazar, live mode'u yapılandırır. Sonraki tüm komutlar bunu okur. |
| `/impeccable craft [feature]` | Tam shape-then-build akışı: önce planla, sonra görsel iterasyonla uçtan uca kur. |
| `/impeccable shape [feature]` | Kod yazmadan önce UX/UI'yi planla. |
| `/impeccable document` | Mevcut proje kodundan kök `DESIGN.md` üret. |
| `/impeccable extract [hedef]` | Tekrar kullanılabilir token ve bileşenleri design system'e çek. |

### 🔎 Evaluate (değerlendir)

| Komut | Ne yapar? |
|-------|-----------|
| `/impeccable critique [hedef]` | UX tasarım incelemesi: hiyerarşi, netlik, duygusal yankı. Heuristic skorlama verir. |
| `/impeccable audit [hedef]` | Teknik kalite: erişilebilirlik (a11y), performans, responsive. |

### ✨ Refine (rafine et)

| Komut | Ne yapar? |
|-------|-----------|
| `/impeccable polish [hedef]` | Ship öncesi son geçiş: design system hizalaması, hazırlık. |
| `/impeccable bolder [hedef]` | Sıkıcı/güvenli tasarımları güçlendir. |
| `/impeccable quieter [hedef]` | Aşırı agresif/uyyarıcı tasarımları sakinleştir. |
| `/impeccable distill [hedef]` | Öze indir, karmaşıklığı temizle. |
| `/impeccable harden [hedef]` | Production-ready: hata yönetimi, i18n, text overflow, edge case. |
| `/impeccable onboard [hedef]` | First-run akışları, empty state'ler, aktivasyon yolları. |

### 🚀 Enhance (zenginleştir)

| Komut | Ne yapar? |
|-------|-----------|
| `/impeccable animate [hedef]` | Amaçlı animasyon ve motion ekle. |
| `/impeccable colorize [hedef]` | Monokrom arayüze stratejik renk ekle. |
| `/impeccable typeset [hedef]` | Tipografi hiyerarşisi ve font seçimini düzelt. |
| `/impeccable layout [hedef]` | Boşluk, ritim, görsel hiyerarşiyi düzelt. |
| `/impeccable delight [hedef]` | Kişilik ve akılda kalıcı detaylar ekle. |
| `/impeccable overdrive [hedef]` | Konvansiyonların ötesine geç, teknik olarak olağanüstü efektler. |

### 🔧 Fix (düzelt)

| Komut | Ne yapar? |
|-------|-----------|
| `/impeccable clarify [hedef]` | UX metinlerini, etiketleri, hata mesajlarını iyileştir. |
| `/impeccable adapt [hedef]` | Farklı cihaz ve ekran boyutlarına uyarla (responsive). |
| `/impeccable optimize [hedef]` | UI performansını tanıla ve düzelt. |

### 🔄 Iterate (görsel olarak yinele)

| Komut | Ne yapar? |
|-------|-----------|
| `/impeccable live` | Canlı tarayıcı modu: elemanları seç, alternatifleri anında üret. (Sadece web.) |

---

## 📐 Yerleşik tasarım rehberliği

Skill her komutta bu kuralları uygular (SKILL.md'ye gömülü):

### Renk
- **Kontrast doğrula.** Body text arka planına karşı ≥4.5:1; büyük text ≥3:1. En sık hata: tinted near-white üzerinde muted gri body text. "Zarafet için açık gri" AI tasarımının en büyük okunabilirlik katilidir.
- Renkli arka planda gri text yıkanmış görünür → arka planın kendi hue'sunun daha koyu tonunu kullan.
- **OKLCH kullan** (yeni projelerde). Cream/sand/bej body bg = 2026'nın doymuş AI varsayılanı — bundan kaçın.
- Renk stratejisi seç: **Restrained** (nötr + 1 accent ≤10%) / **Committed** (1 doymuş renk yüzeyin %30-60'ı) / **Full palette** / **Drenched** (yüzey = renk).

### Tipografi
- Body satır uzunluğu 65–75ch.
- Benzer ama aynı olmayan fontları eşleştirme (iki geometric sans). Contrast ekseni üzerine eşleştir (serif + sans) veya tek aileyi birden çok ağırlıkta kullan.
- Display heading `clamp()` max ≤ 6rem (~96px); letter-spacing ≥ -0.04em.
- `text-wrap: balance` (h1–h3), `text-wrap: pretty` (uzun düzyazı).

### Layout
- Ritim için boşlukları çeşitle.
- **Kart tembelliğin cevabıdır.** Gerçekten en iyi affordance olduğunda kullan. İç içe kart **her zaman** yanlış.
- 1D için Flexbox, 2D için Grid. Breakpoint'siz responsive grid: `repeat(auto-fit, minmax(280px, 1fr))`.
- Semantik z-index skalası kur (dropdown → sticky → modal-backdrop → modal → toast → tooltip). `999`/`9999` asla.

### Motion
- Motion amaçlı olmalı,事后 düşünce (afterthought) değil.
- CSS layout property'lerini animasyonla (gereksizse).
- Exponential ease-out (ease-out-quart/quint/expo). **Bounce yok, elastic yok.**
- `@media (prefers-reduced-motion: reduce)` alternatifi **zorunlu** — her animasyonda.
- İleri motion için kütüphane kullan (motion, gsap, anime.js, lenis).

---

## 🚫 Mutlak yasaklar (AI slop / yapay zeka izi)

Bunları yazmak üzereseyse, elementi farklı yapıyla yeniden yaz (match-and-refuse):

- **Yan çizgi (side-stripe) kenarlıklar.** Kart/liste/callout üzerinde `border-left/right` > 1px renkli accent. Tam kenarlık, bg tint, leading numara/icon veya hiçbiri kullan.
- **Gradient text.** `background-clip: text` + gradient background. Tek solid renk kullan, vurguyu weight/size ile yap.
- **Glassmorphism varsayılan.** Dekoratif blur/cam kartlar. Nadir ve amaçlı, veya hiç.
- **Hero-metric template.** Büyük sayı + küçük etiket + destekleyici stat + gradient accent. SaaS klişesi.
- **Aynı boyutlu kart ızgaraları.** Icon + heading + text, sonsuz tekrar.
- **Her bölümün üstünde küçük uppercase tracked eyebrow.** ("ABOUT" "PROCESS" "PRICING"). 2023'ün doymuş AI iskelesi. Farklı bir kadans seç.
- **Numaralı bölüm işaretleyicileri (01/02/03) varsayılan iskele olarak.** Sıradan bir süreç olduğunda kazanç; her bölümde refleks ise AI grameri.
- **Kapasitesini aşan text.** Uzun heading + büyük clamp + dar grid = tablet/mobile'da overflow. Her breakpoint'te kopyayı test et.

**AI slop testi:** biri bu arayüze bakıp "bunu AI yapmış" diyebiliyorsa, başarısızdır.

---

## 🪝 Otomatik tasarım hook'u

`.claude/settings.local.json` içindeki `PostToolUse` hook'u **otomatik** çalışır:

- **Ne zaman:** UI dosyalarında (HTML/CSS/JSX/TSX/Vue vb.) `Edit`/`Write`/`MultiEdit` sonrası.
- **Ne yapar:** 46 deterministik kuralı çalıştırır (LLM yok, API key yok), bulguları system reminder olarak agent akışına sunar.
- **Ne yakalar:** AI slop (yan çizgi, gradient, bounce easing, dark glow) + genel tasarım kalitesi (satır uzunluğu, dar padding, küçük dokunma hedefi, atlanan heading'ler vb.).

Hook timeout'u 5 saniye, status mesajı "Checking UI changes". Bulguları `npx impeccable detect` ile bağımsız da çalıştırabilirsin.

> DocTick şu an frontend kodu olmadığından hook aktif ama henüz bir şey taramıyor. İlk UI dosyası eklendiği an otomatik devreye girecek.

---

## 💡 Günlük kullanım örnekleri

```text
# 1) Yeni bir feature'ı uçtan uca tasarla + kur
/impeccable craft settings page

# 2) Mevcut bir sayfanın UX incelemesi
/impeccable critique dashboard

# 3) Ship öncesi son geçiş
/impeccable polish checkout

# 4) Edge case + hata yönetimi ekle
/impeccable harden login form

# 5) Sıkıcı bir tasarımı canlandır
/impeccable bolder hero

# 6) Tarayıcıda görsel olarak yinele (dev server çalışırken)
/impeccable live

# 7) Komutu hatırla — argümansız menü + akıllı öneri
/impeccable
```

**Pin (kısayol) oluşturma** — sık kullandığını tek komuta indir:
```
/impeccable pin audit      # /audit artık /impeccable audit demek
```

---

## 🎭 Register: Brand mı, Product mı?

`init` sırasında yüzeyin tipi sorulur; her komut buna göre farklı rehber okur:

- **Brand register** (`reference/brand.md`): marketing, landing, kampanya, long-form içerik, portfolio. **Tasarım ürünün kendidir.**
- **Product register** (`reference/product.md`): app UI, admin, dashboard, tool. **Tasarım ürününe hizmet eder.**

Seçim önceliği: (1) görev ipucu ("landing page" vs "dashboard"); (2) odaktaki yüzey; (3) `PRODUCT.md`'deki `register` alanı.

> DocTick bir **memory-layer dev tool** olduğu için frontend eklendiğinde muhtemelen **Product register** (dashboard/admin tipi) doğru seçim olacak — ama bu `/impeccable init` sırasında netleşecek.

---

## 🤝 Ponytail ile ilişkisi

| | Ponytail | Impeccable |
|---|----------|------------|
| **Sorumlu olduğu** | Ne kod yazılacağı (en az kod) | Yazılan frontend'in görsel kalitesi |
| **Ne zaman aktif** | Her zaman (CLAUDE.md) | İstendiğinde (`/impeccable`) + hook otomatik |
| **Çakışır mı?** | Hayır. Ponytail "bunu yazmaya gerek var mı?" der; Impeccable "yazıyorsan kaliteli olsun" der. |

Örnek birlikte çalışma: "Bir date picker ekle" → Ponytail önce `<input type="date">` (stdlib) önerir; Impeccable ise o input'un kontrastını, dokunma hedefini, `prefers-reduced-motion`unu kontrol eder. Biri miktarı, diğeri kaliteyi yönetir.

---

## 📂 Dosya yapısı

```
DocTick/
├── .claude/
│   ├── settings.local.json                # ⚙️ PostToolUse hook (gitignored, machine-local)
│   └── skills/
│       └── impeccable/
│           ├── SKILL.md                    # 🎨 Ana skill: 23 komut + tasarım kuralları
│           ├── reference/                  # 📚 34 rehber (komutlar + register + platform)
│           │   ├── brand.md / product.md   #    Register rehberleri
│           │   ├── ios.md / android.md     #    Platform rehberleri
│           │   ├── audit.md, critique.md,  #    Her komut için akış
│           │   │   polish.md, live.md ...
│           │   └── ...
│           └── scripts/                    # 🔧 Hook, detector, live server, palette, pin
│               ├── hook.mjs                #    PostToolUse detector girişi
│               ├── detect.mjs              #    Bağımsız 46-kural tarayıcı
│               ├── context.mjs             #    PRODUCT.md/DESIGN.md bağlam okuyucu
│               ├── palette.mjs             #    Marka tohum rengi üreteci
│               └── ...
├── .impeccable/                            # 🗂 Çalışma dosyaları (ephemeral, gitignored)
│   ├── config.json                         #    ✅ TRACKED — paylaşılan config
│   ├── design.json                         #    ✅ TRACKED — paylaşılan design spec
│   └── critique/*.md                       #    ✅ TRACKED — inceleme raporları
└── IMPECCABLE-KILAVUZ.md                   # 📖 Bu kılavuz
```

> `.impeccable/` klasörü `init`/komutlar çalıştıkça oluşur. Çoğu ephemeral (gitignored); sadece `config.json`, `design.json`, `live/config.json`, `critique/*.md` tracked (paylaşılan proje artifact'leri).

---

## 🔧 Yönetim: pin / hooks

```bash
# Pin (kısayol) — sık komutu tek slash'a indir
/impeccable pin audit            # /audit kısayolu oluşturur
/impeccable unpin audit          # kaldırır

# Hook yönetimi
/impeccable hooks status         # hook açık mı?
/impeccable hooks off            # geçici kapat
/impeccable hooks on             # aç
/impeccable hooks ignore-rule <kural>   # belirli kuralı yok say
```

Pin/unpin aynı zamanda `node .claude/skills/impeccable/scripts/pin.mjs <pin|unpin> <komut>` ile de çalışır.

---

## 🔜 Sırada ne var? (`/impeccable init`)

Impeccable kuruldu ve aktif, ama **`PRODUCT.md` / `DESIGN.md` henüz yok**. Bu dosyalar `/impeccable init` sırasında, ürün bağlamını toplayarak yazılır.

DocTick frontend'i başladığında şunu çalıştır:

```text
/impeccable init
```

Bu şunları sorar/yazar:
- **Surface tipi:** brand (marketing/landing) mi, product (app/dashboard) mi? (DocTick → muhtemelen product)
- **Audience, brand/product lane, voice, anti-references**
- **Renkler, tipografi, bileşenler**
- `PRODUCT.md` + `DESIGN.md` + live config + sonraki adım önerileri

> Bu kılavuzu yazarken `PRODUCT.md`'yi **tahmin ederek uydurmadım** (ponytail: problemi anlamadan kod yazma). DocTick'i bir cümlede tanımlarsan init'i senin için çalıştırıp `PRODUCT.md`'yi doldurabilirim.

---

## ♻️ Güncelleme / kaldırma

**Güncelle:**
```bash
npx --yes impeccable@latest update --providers=claude --scope=project
```
(Codex kullanıyorsan update sonrası `/hooks`'u açıp project hook'u onayla.)

**Kaldır:**
```bash
# Skill + hook
rm -rf .claude/skills/impeccable
rm .claude/settings.local.json     # veya içindeki impeccable PostToolUse girişini çıkar

# Çalışma dosyaları
rm -rf .impeccable

# .gitignore içindeki "impeccable-ignore-start ... end" bloğunu ve
# ".claude/settings.local.json" satırını çıkar

# Bu kılavuz
rm IMPECCABLE-KILAVUZ.md
```

---

## ❓ SSS

**Ponytail / superpowers / memkraft ile çakışır mı?**
Hayır. Impeccable *frontend görsel kaliteyi* yönetir. Ponytail *kod miktarını*, superpowers *yaklaşımı* (TDD, brainstorm), memkraft *hafızayı* yönetir. Her biri farklı bir eksende; birlikte çalışırlar. Kullanıcı talimatı her zaman önceliklidir.

**Backend (Python) kodumda hook çalışır mı?**
Hayır. Hook sadece UI dosyalarında (HTML/CSS/JSX/TSX/Vue/Svelte vb.) tetiklenir. DocTick'in Python backend'ini etkilemez.

**`PRODUCT.md` olmadan komutlar çalışır mı?**
Evet. Scoped bir istek (mevcut kodu değerlendir/iyileştir) için `PRODUCT.md` zorunlu değildir — mevcut kod bağlam olarak yeter. Sadece `init`/`craft`/`shape` gibi sıfırdan kurulum akışları için bağlam toplar.

**Live mode (tarayıcı iterasyonu) nasıl çalışır?**
Dev server'ın çalışırken `/impeccable live` → tarayıcıda eleman seç, alternatifleri anında üret, beğendiğini uygula. Sadece web; native (ios/android) için geçerli değil.

**Anti-pattern listesini nereden okuyacağım?**
`.claude/skills/impeccable/SKILL.md` (Ana kurallar + mutlak yasaklar) ve `reference/brand.md`/`product.md` (register'a özgü). Her komutun da kendi `reference/<komut>.md`'si var.

**Daha fazla kaynak?**
- Repo: https://github.com/pbakaus/impeccable
- Site + docs: https://impeccable.style
- Detector docs: `impeccable.style/docs/detector`
- Hook docs: `impeccable.style/docs/hooks`

---

*Kaynak: pbakaus/impeccable (Apache 2.0) — bu kılavuz yetenekleri DocTick projesi için CLI kurulum yöntemiyle uyarlar. Sürüm 3.9.1.*
