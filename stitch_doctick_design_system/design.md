---
version: alpha
name: DocTick
description: Hastaneler ve klinikler için sakin, klinik ve güven veren online randevu sistemi. Lacivert-mavi marka, Sora başlıklar, IBM Plex gövde.
colors:
  # Marka (blue scale)
  brand: "#1B5493"
  brandStrong: "#164478"
  brandSoft: "#EEF4FB"
  brandLine: "#AFCCEE"
  surfaceBrand: "#164478"
  blue100: "#D8E6F7"
  blue300: "#7FACDF"
  blue500: "#2568AE"
  blue700: "#164478"
  # Metin
  textPrimary: "#12222F"
  textSecondary: "#51626F"
  textMuted: "#70808C"
  textOnBrand: "#FFFFFF"
  link: "#1B5493"
  # Yüzeyler
  surfacePage: "#F7F9FB"
  surfaceCard: "#FFFFFF"
  surfaceSunken: "#EEF2F6"
  # Kenarlıklar
  borderDefault: "#CAD4DC"
  borderSoft: "#E3E9EE"
  borderFocus: "#2568AE"
  # Durum renkleri (rozetler)
  statusConfirmed: "#1B8354"
  statusConfirmedBg: "#DCF2E7"
  statusPending: "#A16814"
  statusPendingBg: "#FAEEDA"
  statusCancelled: "#C03B36"
  statusCancelledBg: "#F9E4E3"
  statusNeutral: "#51626F"
  statusNeutralBg: "#E3E9EE"
  # Avatar
  avatarBg: "#D8E6F7"
  avatarIcon: "#164478"
typography:
  display:
    fontFamily: "Sora"
    fontSize: 32
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  h1:
    fontFamily: "Sora"
    fontSize: 24
    fontWeight: 700
    lineHeight: 1.25
  h2:
    fontFamily: "Sora"
    fontSize: 19
    fontWeight: 600
    lineHeight: 1.3
  h3:
    fontFamily: "Sora"
    fontSize: 16
    fontWeight: 600
    lineHeight: 1.35
  bodyLg:
    fontFamily: "IBM Plex Sans"
    fontSize: 16
    fontWeight: 400
    lineHeight: 1.55
  bodyMd:
    fontFamily: "IBM Plex Sans"
    fontSize: 14.5
    fontWeight: 400
    lineHeight: 1.5
  bodySm:
    fontFamily: "IBM Plex Sans"
    fontSize: 13
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "IBM Plex Sans"
    fontSize: 13
    fontWeight: 600
    lineHeight: 1.2
  caption:
    fontFamily: "IBM Plex Sans"
    fontSize: 12
    fontWeight: 400
    lineHeight: 1.4
  overline:
    fontFamily: "IBM Plex Sans"
    fontSize: 11
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
  time:
    fontFamily: "IBM Plex Mono"
    fontSize: 15
    fontWeight: 600
  timeLg:
    fontFamily: "IBM Plex Mono"
    fontSize: 22
    fontWeight: 600
rounded:
  sm: 8
  md: 10
  lg: 14
  pill: 999
spacing:
  scale: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64]
  pagePad: 24
  cardPad: 20
  stackGap: 16
components:
  buttonPrimary:
    backgroundColor: brand
    textColor: textOnBrand
    typography: label
    rounded: sm
  buttonSecondary:
    backgroundColor: surfaceCard
    textColor: textPrimary
    typography: label
    rounded: sm
  buttonDanger:
    backgroundColor: statusCancelled
    textColor: textOnBrand
    typography: label
    rounded: sm
  buttonGhost:
    backgroundColor: surfaceCard
    textColor: brand
    typography: label
    rounded: sm
  card:
    backgroundColor: surfaceCard
    rounded: md
    padding: cardPad
  badge:
    typography: caption
    rounded: pill
  input:
    backgroundColor: surfaceCard
    textColor: textPrimary
    rounded: sm
  navBar:
    backgroundColor: surfaceBrand
    textColor: textOnBrand
  sidebar:
    backgroundColor: surfaceBrand
    textColor: textOnBrand
  timeSlot:
    backgroundColor: surfaceCard
    textColor: textPrimary
    typography: time
    rounded: sm
  avatar:
    backgroundColor: avatarBg
    textColor: avatarIcon
    rounded: pill
---

# Overview

DocTick, hastaneler ve klinikler için bir **online randevu sistemidir**: hasta bölüm → doktor → uygun saat seçerek randevu alır; yönetici kullanıcıları, doktorları ve haftalık çalışma saatlerini yönetir.

Görsel niyet: **sakin, klinik, güven veren.** Süs değil, netlik. Bol beyaz alan, yumuşak gölgeler, tek ve tutarlı bir lacivert-mavi marka rengi (`#1B5493`). Başlıklar karakterli ve modern (**Sora**), gövde metni son derece okunaklı (**IBM Plex Sans**), saat ve randevu kodları monospace (**IBM Plex Mono**) — çünkü bunlar "veri" ve hizalı görünmeli. Ton profesyonel ve sağlık odaklı; agresif pazarlama dili yok. Arayüz dili **Türkçe**dir.

# Colors

Renkler role göre kullanılır, keyfi değil:

- **brand `#1B5493`** — birincil eylem rengi (butonlar, seçili durumlar, vurgular, saat rakamları). **brandStrong `#164478`** hover/basılı; ayrıca üst bar ve admin kenar çubuğunun koyu zemini (`surfaceBrand`). **brandSoft `#EEF4FB`** seçili kartların hafif zemini.
- **Metin:** `textPrimary #12222F` (ana), `textSecondary #51626F` (ikincil/açıklama), `textMuted #70808C` (silik/caption). Koyu zemin üzerinde `textOnBrand #FFFFFF`.
- **Yüzeyler:** sayfa `surfacePage #F7F9FB`, kartlar `surfaceCard #FFFFFF`, gömük paneller `surfaceSunken #EEF2F6`.
- **Kenarlıklar:** `borderDefault #CAD4DC`, ince ayraçlar `borderSoft #E3E9EE`, odak halkası `borderFocus #2568AE` (3px, %28 opaklık).
- **Durum rozetleri (semantik):** Onaylı = yeşil `#1B8354` / zemin `#DCF2E7`; Beklemede = amber `#A16814` / `#FAEEDA`; İptal/Reddedildi = kırmızı `#C03B36` / `#F9E4E3`; Nötr/Tamamlandı = gri `#51626F` / `#E3E9EE`.

# Typography

- **Sora** yalnızca başlıklar için: `display` (sayfa başlığı 32/700, hafif negatif letter-spacing), `h1` 24/700, `h2` 19/600, `h3` 16/600 (kart başlıkları, satır içi isimler).
- **IBM Plex Sans** tüm gövde/etiket için: `bodyLg/bodyMd/bodySm`, `label` (form etiketleri, nav — 13/600), `caption` (12/400), `overline` (11/600, BÜYÜK HARF, geniş letter-spacing — tablo başlıkları).
- **IBM Plex Mono** yalnızca sayısal/kimlik verisi için: saatler (`time` 15/600, `timeLg` 22/600) ve randevu kodları (`RND-2026-0007`). Bu, saatlerin bir "veri noktası" gibi hizalı ve okunur görünmesini sağlar.

# Layout

- İçerik `surfacePage` üstünde ortalanır. **Hasta tarafı** üst yatay bar + genişliği ~1440px'e kadar ortalı içerik. **Admin tarafı** solda sabit ~220px kenar çubuğu + sağda ~980px'e kadar ana kolon.
- Ritim: sayfa kenar boşluğu **24px**, kart iç boşluğu **20px**, bloklar arası dikey boşluk **16px**. Spacing ölçeği `[4,8,12,16,20,24,32,40,48,64]`.
- Listeler/tablolar kartın içinde ince `borderSoft` ayraçlarla satırlara bölünür; üstte `overline` sütun başlıkları.
- Randevu alma akışı 3 adımlı yatay bir **stepper** ile ilerler (tamamlanan adımlar tikli, aktif adım vurgulu).

# Elevation & Depth

Derinlik minimaldir ve amaca yöneliktir:

- **Kart gölgesi:** `0 1px 2px rgba(14,42,74,.05)` + `0 4px 14px rgba(14,42,74,.07)` — havadar, sert değil.
- Üst bar **yapışkan (sticky)** ve içeriğin üzerinde durur (hafif katman hissi).
- **Modal diyaloglar** kararan yarı saydam bir zemin (backdrop) üzerinde ortalanır; içerik kartı biraz daha belirgin gölge alır.
- Seçili slot/gün gibi durumlarda gölge yerine **renk ve kenarlık** ile derinlik verilir.

# Shapes

- **Yarıçaplar:** butonlar ve form alanları `sm 8px`, kartlar `md 10px`, büyük konteynerler `lg 14px`.
- **Pill (999px):** durum rozetleri, saat/gün çipleri.
- **Daire:** kullanıcı ve doktor avatarları (`avatarBg #D8E6F7` zemin, `avatarIcon #164478` ikon), stepper adım numaraları.
- Genel his: yumuşak köşeli, keskin olmayan, dost ama ciddi.

# Components

- **Butonlar:** `buttonPrimary` (marka dolgu, beyaz etiket), `buttonSecondary` (beyaz zemin, `borderDefault` kenar, koyu metin), `buttonDanger` (kırmızı dolgu — iptal/sil), `buttonGhost` (saydam, marka metin). Küçük öndeki ikon opsiyonel. Boyutlar: `sm` ve `md`.
- **Card:** beyaz, `md` yarıçap, ince kenar/gölge; solda opsiyonel kalın başlık (Sora), sağda opsiyonel küçük aksiyon/rozet.
- **Badge:** durum renkli pill (yukarıdaki semantik renkler).
- **Switch:** açıkken marka renginde toggle.
- **Input / Select / Textarea:** üstte `label` (13/600), altında `borderDefault` kenarlı `sm` yarıçaplı alan, odak halkası.
- **Dialog:** ortalanmış beyaz kart, kararan zemin, başlık + gövde + sağda `Vazgeç` (secondary) ve birincil/danger aksiyon.
- **Tabs:** `Yaklaşan / Geçmiş / İptal edilen` gibi sekmeler; aktif olan vurgulu.
- **TimeSlot:** saat çipi — Müsait (beyaz, kenarlı), Seçili (marka dolgu, beyaz metin), Dolu (gömük gri, pasif).
- **Stepper:** dairesel numaralı adımlar + aralarında ilerleme çizgisi; tamamlanan adım tik ikonlu ve marka renkli.
- **Avatar:** daire, açık mavi zemin + koyu mavi kullanıcı ikonu.

# Do's and Don'ts

**Do**
- Birincil renk **tam olarak `#1B5493`**; üst bar/kenar çubuğu **`#164478`**.
- Başlıklarda **Sora**, gövdede **IBM Plex Sans**, saat/kodda **IBM Plex Mono** kullan.
- Tüm görünen metinleri **Türkçe** ve verildiği gibi bırak.
- Bol beyaz alan, yumuşak gölge, klinik sadelik.
- Durum bilgisini her zaman **semantik rozet renkleriyle** göster.

**Don't**
- Teal, mor, degrade-ağırlıklı ya da "startup" tarzı süslü renkler kullanma.
- İstenmeyen pazarlama bölümleri, illüstrasyon kalabalığı veya ekstra CTA ekleme.
- Saatleri/randevu kodlarını gövde fontuyla yazma (mono olmalı).
- Rozet renklerini rastgele kullanma (yeşil=onay, amber=bekliyor, kırmızı=iptal/red).

<!--
DocTick DESIGN.md — kaynak: frontend/src/styles/tokens/* (colors, typography, spacing, effects) + pages/*.
Doğrulamak için:  npx @google/design.md lint DESIGN.md
Ekran ekran promptlar ayrı dosyada: docs/mockup/DocTick-Stitch-Brief.md
-->
