# DocTick Design System

**DocTick**, bir hastane online randevu sistemidir (staj projesi). Hastalar bölüm/doktor/saat seçerek randevu alır, görüntüler, iptal eder ve hizmet sonrası değerlendirme yapar; e-posta ile bilgilendirme ve hatırlatma gönderilir. Adminler bölümleri, doktorları ve randevu saatlerini açar, hatırlatma e-postalarını yönetir.

**Kaynaklar:**
- Yerel klasör `DocTick/` (bağlı codebase) — **UI kodu içermiyor**; yalnızca memkraft memory-katmanı kurulumu, CLAUDE.md (ponytail kuralları) ve spec dokümanları var. Bu design system bu yüzden **sıfırdan** tasarlandı; codebase'ten yalnızca ürün bağlamı (Türkçe, staj projesi, hastane randevu alanı) alındı.
- Kullanıcının proje tanımı (bölümler/doktorlar/saatler, hatırlatma e-postası, iptal, değerlendirme).
- Not: Kullanıcı açıklamasında ad "DockTick" yazılmış; codebase tutarlı biçimde **DocTick** kullanıyor — DocTick benimsendi.

## Ürünler / Yüzeyler
1. **Hasta uygulaması** — bölüm & doktor seçimi, uygun saatler, randevu alma/görüntüleme/iptal, değerlendirme.
2. **Admin paneli** — bölüm/doktor/saat yönetimi, hatırlatma e-postası ayarları.

## CONTENT FUNDAMENTALS
- **Dil:** Türkçe. Arayüz metinleri **"siz" değil, kibar emir + 2. çoğul**: "Randevu alın", "Saat seçin", "Değerlendirmenizi paylaşın".
- **Ton:** Sakin, güven veren, klinik ama soğuk değil. Kısa cümleler; tıbbi jargon yok.
- **Casing:** Cümle düzeni (sentence case) her yerde — buton dahil: "Randevuyu onayla", başlıklar: "Yaklaşan randevularınız".
- **Kişi:** Kullanıcıya "siz"; sistem kendinden "DocTick" diye bahseder ("DocTick size hatırlatma gönderecek").
- **Emoji:** Kullanılmaz. Durumlar renk + rozetle anlatılır.
- **Tarih/saat:** `24 Tem 2026, Cum` + saat monospace `09:30` biçiminde. Saat her zaman mono fontta — markanın "tick" (dakiklik) motifi.
- Örnek onay metni: "Randevunuz oluşturuldu. Onay e-postası adresinize gönderildi."
- Örnek boş durum: "Henüz randevunuz yok. İlk randevunuzu birkaç adımda alın."

## VISUAL FOUNDATIONS
- **Renk:** Klinik mavi marka rengi (`--blue-600 #1B5493`), maviye çalan mürekkep metin (`--ink-900 #12222F`), kırık-beyaz zemin (`--paper #F7F9FB`). Randevu durumları semantik: onaylı=yeşil, bekliyor=amber, iptal=kırmızı, tamamlandı=gri. Sayfa başına 1 marka rengi + durum renkleri; gradyan yok.
- **Tipografi:** Display/başlık **Sora** (600–800, sıkı letter-spacing), gövde **IBM Plex Sans**, saat/kod **IBM Plex Mono**. Mono saatler marka motifi. Min gövde 13px.
- **Arka planlar:** Düz renk; imgesiz. Kart beyazı `--surface-card`, çukur alanlar `--surface-sunken`. Görsel/illüstrasyon kaynakta yok — kullanılmıyor.
- **Kartlar:** Beyaz, `--radius-lg 14px`, 1px `--border-soft` + `--shadow-card` (çok hafif). Renkli sol-border kart deseni YOK.
- **Köşeler:** input/buton 10px, kart 14px, rozet/slot pill.
- **Gölge:** İki katman, mavi-tonlu, düşük opaklık. Popover/dialog `--shadow-pop`.
- **Animasyon:** Kısa ve işlevsel: 120–200ms, `cubic-bezier(.2,.8,.3,1)`; fade+2px yükselme. Bounce yok.
- **Hover:** Butonlar bir ton koyulaşır (`--brand-strong`); satır/kartlar `--surface-sunken` zemin alır. **Press:** bir ton daha koyu; shrink yok.
- **Focus:** 3px mavi halka `--focus-ring`, her interaktif öğede.
- **Layout:** İçerik maks 1080px, 24px sayfa padding'i; 4px taban aralık ölçeği. Hasta uygulamasında üst bar sabit.
- **Transparanlık/blur:** Yalnız dialog scrim'i (`rgba(18,34,47,.45)`); blur yok.

## ICONOGRAPHY
- Kaynakta ikon/logo/asset **yok**. **Logo yoktur; çizilmedi** — marka adı düz yazıyla (Sora 800) dizilir.
- İkon seti: **Lucide** (CDN, stroke 2px) — klinik, ince çizgili stil markayla uyumlu. Kullanım: `<script src="https://unpkg.com/lucide@latest"></script>` + `lucide.createIcons()`, ya da tek tek SVG kopyalama. Boyut 16/20px, renk `currentColor`.
- Emoji ve unicode-ikon kullanılmaz. **Substitüsyon bayrağı:** Lucide bizim seçimimizdir; gerçek marka ikon seti varsa iletin.

## Fontlar — substitüsyon bayrağı
Font dosyası verilmedi. Google Fonts'tan seçildi: **Sora**, **IBM Plex Sans**, **IBM Plex Mono** (hepsi latin-ext/Türkçe destekli), `tokens/fonts.css` üzerinden CDN. Gerçek marka fontları varsa dosyaları iletin, `@font-face`'e çevrilir.

## Intentional additions
Kaynakta komponent envanteri olmadığı için standart set sıfırdan yazıldı. Alan-özel eklemeler:
- **TimeSlot** — randevu saati seçici çipi (uygun/seçili/dolu); ürünün çekirdek etkileşimi.
- **Rating** — 5 yıldız değerlendirme; "hizmeti değerlendirme" gereksinimi.
- **StatusBadge** (Badge varyantı) — randevu durum rozetleri.
- **Icon** — Lucide glyph sarmalayıcısı (yol verileri projeye kopyalandı; CDN gerekmez).

## Index
- `styles.css` → `tokens/` (fonts, colors, typography, spacing, effects)
- `guidelines/` — foundation specimen kartları
- `components/forms/` — Button, IconButton, Input, Select, Checkbox, Radio, Switch
- `components/display/` — Card, Badge, Rating, TimeSlot
- `components/feedback/` — Dialog, Toast, Tabs
- `ui_kits/hasta/` — hasta uygulaması (index.html, ekran JSX'leri)
- `ui_kits/admin/` — admin paneli
- `SKILL.md` — agent skill tanımı
