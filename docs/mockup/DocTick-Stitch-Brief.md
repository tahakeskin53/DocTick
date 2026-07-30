# DocTick — Google Stitch Mockup Brief

Bu doküman, DocTick'in **var olan siteyle çok yakın (aynı kimlik)** mockup'larını Google Stitch'te üretmek içindir. Aşağıdaki değerler doğrudan uygulamanın kaynak kodundaki tasarım tokenlarından (`frontend/src/styles/tokens/*`) alınmıştır — uydurma değildir.

> **Not:** Stitch bir görselden piksel-kopya yapmaz; kendi diline "yeniden üretir". Bu yüzden "birebir aynı" pratikte **aynı renk/font kimliği + aynı yerleşim + aynı metinler** demektir. En büyük sadakat kaldıracı, aşağıdaki **Global Stil**'i her ekranda tutarlı kullanmaktır.

---

## 0) Stitch'te nasıl kullanılır

1. Stitch'te **yeni bir proje** aç (Web / Desktop). "Tasarımınızla başlayın" ekranı çıkar.
2. **Tema:** Repo kökündeki **`DESIGN.md`** dosyasını kullan — ya içeriğini üstteki "Buraya bir DESIGN.md dosyası yapıştırın" kutusuna yapıştır, ya da "DESIGN.md dosyası yükleyin" ile dosyayı sürükle. Bu, projenin tema/kimliğini (renk/font/bileşen) sabitler. *(Alternatif/eski yol: aşağıdaki Bölüm 1 – Global Stil bloğunu ilk prompt olarak yapıştırmak. DESIGN.md tercih edilir.)*
3. Sonra her ekran için **Bölüm 3'teki ilgili prompt bloğunu** sırayla yapıştır (A → C). Her blok tek bir ekran üretir; tema DESIGN.md'den uygulanır.
4. Çıktı sapıyorsa (renk/yerleşim), Bölüm 4'teki **iterasyon cümleleriyle** düzelt.
5. Beğendiğin ekranları **Figma'ya veya HTML'e export** et.

**Prompt dili:** Prompt gövdeleri İngilizce yazıldı (Stitch İngilizcede en iyi sonucu verir); ancak **ekranda görünecek tüm metinler Türkçe ve tırnak içinde birebir** verildi — Stitch bunları aynen basmalı. Türkçe metinleri değiştirme.

**Sadakat artırmak istersen (opsiyonel):** Bir ekranın gerçek görüntüsünü elde edebilirsen (uygulamayı çalıştırıp ekran görüntüsü), Stitch'e prompt'la birlikte **referans görsel** olarak yükle → sonuç bir tık daha yakınlaşır. Şart değil; Global Stil tek başına çok yakın sonuç verir.

---

## 1) GLOBAL STİL (yedek — DESIGN.md yoksa ilk prompt olarak yapıştır)

> **Tercih edilen yol repo kökündeki `DESIGN.md`.** Aşağıdaki blok, DESIGN.md yükleyemediğin bir ortam için düz-metin yedeğidir; aynı değerleri içerir.

```
You are designing a clean, modern hospital appointment web app called "DocTick". Use this exact design system for EVERY screen.

COLORS
- Primary / brand: #1B5493 (deep navy-blue). Hover/pressed: #164478. Soft brand tint (backgrounds): #EEF4FB. Brand line: #AFCCEE.
- Dark brand surface (top header bar & side navigation & email header): #164478 with white text.
- Text: primary #12222F, secondary #51626F, muted #70808C, links #1B5493, text on brand #FFFFFF.
- Surfaces: page background #F7F9FB, cards #FFFFFF, sunken/inset #EEF2F6.
- Borders: default #CAD4DC, soft #E3E9EE. Focus ring: 3px rgba(37,104,174,.28).
- Status pills: Confirmed = text #1B8354 on #DCF2E7; Pending = text #A16814 on #FAEEDA; Cancelled = text #C03B36 on #F9E4E3; Neutral/Done = text #51626F on #E3E9EE.
- Small avatar circles: background #D8E6F7 with a #164478 user icon.

TYPOGRAPHY
- Headings use "Sora" (bold 700 / semibold 600). Body text uses "IBM Plex Sans". Times and appointment codes use "IBM Plex Mono".
- Sizes: page title (display) 32px/700; H1 24px/700; H2 19px/600; H3 16px/600; body 14.5px; small 13px; caption 12px; overline 11px uppercase with wide letter-spacing; time 15px mono, large time 22px mono.

SHAPE & DEPTH
- Corner radius: buttons & inputs 8px; cards 10px; large containers 14px; pills fully rounded.
- Card shadow: soft, 0 1px 2px rgba(14,42,74,.05) plus 0 4px 14px rgba(14,42,74,.07). Keep it subtle and airy.
- Generous whitespace. Content max width ~1440px (patient) / main column ~980px (admin). Card padding 20px, vertical gap between blocks 16px.

COMPONENTS
- Primary button: brand #1B5493 fill, white label, radius 8, semibold, optional small leading icon. Secondary button: white fill, #CAD4DC border, dark text. Danger button: #C03B36 fill, white text. Ghost button: transparent, brand text.
- Card: white, radius 10, subtle border/shadow, optional bold title (Sora) on the left and optional small action on the right.
- Status badge: small rounded pill using the status colors above.
- Toggle switch: brand color when on.
- Input / Select / Textarea: label above field (13px semibold), field with #CAD4DC border, radius 8, subtle focus ring.
- Modal dialog: centered white card, dimmed backdrop, title, body, footer with a secondary button + a primary (or danger) button on the right.

TONE: professional, medical, trustworthy, calm. Turkish language. Do not add features or text that are not specified per screen.
```

---

## 2) ORTAK KABUKLAR (her ekran bunlardan birini kullanır)

Aşağıdaki iki kabuk metnini, ilgili ekran prompt'unun içinde geçtiği yerde kullan (prompt'larda "PATIENT SHELL" / "ADMIN SHELL" diye anılır).

**PATIENT SHELL** (hasta ekranları 5–11, 20):
```
Use this exact top header and nothing else at the top: a full-width sticky header bar with background EXACTLY #164478 (deep navy), about 58px tall. On the left: the white "DocTick" logo (a small medical cross/tick mark + "DocTick" wordmark). Right after the logo, four white navigation links in this exact order: "Ana sayfa", "Randevu al", "Randevularım", "İletişim" — the active one shown as a subtle translucent-white rounded pill. On the far right: a small white user icon, the name "Elif Yurt", and a small white outline logout icon button. This header must NEVER contain "Hakkımızda", "Departmanlar", "Doktorlar", "SSS", or a "Giriş Yap" button. The page has NO footer at the bottom. Body area below on #F7F9FB, centered, max width ~1080px, comfortable padding.
```

**ADMIN SHELL** (admin ekranları 12–19):
```
Use this exact frame: a left vertical sidebar about 220px wide with background EXACTLY #164478 (deep navy) and white text, full height. Top of the sidebar: the white "DocTick" logo + a faded "ADMİN" overline label. Vertical nav items, each with a leading icon, in this exact order: "Genel bakış", "Bölümler", "Doktorlar", "Randevu saatleri", "E-posta ayarları", "Kullanıcılar" — the active item is a translucent-white pill. Bottom of the sidebar: a faded "Elif Yurt — Çıkış" row with a logout icon. There is NO top marketing navigation and NO footer anywhere. Main content area to the right on #F7F9FB, padding 18–28px, max column width ~980px.
```

---

## 3) EKRAN PROMPT'LARI

### A · Hasta & Kimlik

---

#### Ekran 1 — Landing / Giriş (hero)
*Üretir: giriş yapılmamış karşılama ekranı, Google ile giriş CTA'sı.*
> Gerçek uygulamada burası sinematik, kaydırma tabanlı bir deneyim; mockup onun **hero karesini** temsil eder.

```
Create a single landing screen for "DocTick", a hospital online appointment web app. There is NO navigation menu, NO header links, and NO footer anywhere on the page.

Full-height hero on a soft vertical gradient from #F7F9FB (top) to #EEF4FB (bottom), with a faint blue ECG/heartbeat line drawn subtly across the background at very low opacity.

In the top-left corner there is only the "DocTick" logo: a small circular medical mark in #1B5493 next to the "DocTick" wordmark. Nothing else sits in the top area — no menu, no buttons.

The main content is two columns, vertically centered:
- Left column: a large bold Sora headline "Hastane randevunuzu dakikalar içinde alın"; below it a calm paragraph "Bölümünüzü ve doktorunuzu seçin, uygun saati ayırın — onay ve hatırlatma e-postayla gelsin."; and below that a single prominent white "Google ile giriş yap" button with the multicolor Google 'G' icon — this is the only call to action on the page.
- Right column: a clean white product-preview card (radius 10, soft shadow) showing a sample appointment: a large blue mono time "09:30", bold "Uzm. Dr. Ayşe Demir", caption "Kardiyoloji · 24 Tem 2026", and a small green "Onaylandı" pill.

At the bottom of the hero, one centered thin row with three counters in #1B5493: "5" over "Branş", "6" over "Doktor", "300+" over "Uygun saat".

Colors: brand #1B5493, any dark navy #164478. Headings in "Sora", body in "IBM Plex Sans", the time in "IBM Plex Mono". Clean, clinical, calm, trustworthy. No footer, no copyright bar, no extra marketing sections.
```

---

#### Ekran 2 — Google ile giriş anı
*Üretir: giriş kartı / "Google ile giriş" odaklı sade ekran.*
```
Design a minimal sign-in screen for "DocTick" centered on a #F7F9FB page. A single white card (radius 10, soft shadow, max width ~400px) centered. Inside: the "DocTick" logo (circular brand mark #1B5493 + wordmark), a title "DocTick'e giriş yapın", a short line "Randevularınızı yönetmek için hesabınızla devam edin.", then a full-width "Google ile giriş yap" button showing the Google 'G' logo. Below in caption text: "Devam ederek kullanım koşullarını kabul edersiniz." Calm, clean, medical. Brand #1B5493, headings in Sora.
```

---

#### Ekran 3 — Onay bekliyor (Beklemede)
*Üretir: hesabı onay bekleyen kullanıcı durumu.*
```
Design a status screen centered on a #F7F9FB page. A single white card (radius 10, soft shadow, max width ~400px), left-aligned content. At top a round amber icon (a clock) in color #A16814. Title in Sora "Hesabınız onay bekliyor". Body text in secondary color: "elif.yurt@gmail.com adresi için yönetici onayı bekleniyor. Onaylandıktan sonra randevu alabilirsiniz; bilgilendirme e-postası gönderilir." Below, a secondary button "Çıkış yap" with a logout icon. Calm, informative. Brand #1B5493.
```

---

#### Ekran 4 — Reddedildi
*Üretir: başvurusu onaylanmayan kullanıcı durumu.*
```
Design a status screen centered on a #F7F9FB page. A single white card (radius 10, soft shadow, max width ~400px), left-aligned. At top a round red icon (an envelope/mail) in color #C03B36. Title in Sora "Hesap başvurunuz onaylanmadı". Body in secondary color: "Başvurunuz şu anda onaylanamadı. Daha fazla bilgi için hastane ile iletişime geçin." Below, a secondary button "Çıkış yap" with a logout icon. Serious but respectful tone. Brand #1B5493.
```

---

#### Ekran 5 — Hasta Ana Sayfa
*Üretir: hoş geldin + yaklaşan randevu kartı + 3 kısayol kartı.*
```
Use the PATIENT SHELL with "Ana sayfa" active. Page content: a large Sora greeting "Merhaba Elif," with subline "Randevularınızı buradan yönetin; hatırlatmaları DocTick gönderir." Then a white card titled "Yaklaşan randevunuz" with a green "Onaylandı" status badge on the right; inside the card a large mono time "09:30" in brand blue, then bold "Uzm. Dr. Ayşe Demir", secondary line "Kardiyoloji · 24 Tem 2026, Cum", and a small secondary button "Detaylar". Below, a row of three equal white cards, each with a brand-blue icon on top, a bold H3 title, a short description, and a small button:
1) icon calendar, "Yeni randevu", "Bölüm ve doktor seçin, uygun saati ayırın.", button "Randevu al".
2) icon bell, "Hatırlatmalar", "Randevunuzdan 24 saat önce e-posta alırsınız.", ghost button "Randevularım".
3) icon star, "Değerlendirme", "Geçmiş randevularınız için hizmeti puanlayın.", ghost button "Geçmişe git".
Airy layout, brand #1B5493.
```

---

#### Ekran 6 — Randevu Al · Adım 1 (Bölüm & doktor)
*Üretir: 3 adımlı stepper, ilk adımda bölüm seçimi + doktor grid.*
```
Use the PATIENT SHELL with "Randevu al" active. Page title (Sora display) "Randevu al" with subline "Birkaç adımda bölümünüzü, doktorunuzu ve saatinizi belirleyin."
Below, a horizontal 3-step progress stepper: step 1 "Bölüm & doktor" (ACTIVE, filled brand circle "1"), connector, step 2 "Tarih & saat" (inactive gray circle "2"), connector, step 3 "Onay" (inactive "3").
Then a white card titled "Bölüm ve doktor seçin". Inside: a "Bölüm" dropdown showing "Kardiyoloji" selected. Below the dropdown a responsive grid of selectable doctor cards, each with a round blue avatar (user icon), a bold name and a small department caption:
- "Uzm. Dr. Ayşe Demir" / "Kardiyoloji" (SELECTED, brand border + soft brand tint background)
- "Doç. Dr. Mehmet Kaya" / "Kardiyoloji"
- "Uzm. Dr. Elif Şahin" / "Kardiyoloji"
Bottom bar: left caption "Adım 1 / 3", right a primary button "Devam et". Brand #1B5493.
```

---

#### Ekran 7 — Randevu Al · Adım 2 (Tarih & saat)
*Üretir: gün şeridi (oklarla) + saat ızgarası + Müsait/Seçili/Dolu lejantı.*
```
Use the PATIENT SHELL with "Randevu al" active. Same page title and 3-step stepper, but now step 1 is completed (brand circle with a check) and step 2 "Tarih & saat" is ACTIVE.
A white card titled "Uygun saatler — Uzm. Dr. Ayşe Demir" with a small right caption "Kardiyoloji". Inside:
- Label "Gün seçin", then a horizontal scrollable strip of day chips with a left chevron and right chevron button on each side. Each chip shows a small uppercase weekday over a bold day+month, e.g. "PZT / 24 Tem", "SAL / 25 Tem", "ÇAR / 26 Tem"… One chip is SELECTED (filled brand blue, white text).
- Label "Saat seçin" with a small legend on the right: a swatch "Müsait" (white), "Seçili" (brand blue), "Dolu" (gray sunken).
- A wrap of time-slot chips (mono font): "09:00", "09:30" (SELECTED, brand fill white text), "10:00", "10:30", "11:00", "11:30", "13:30", "14:00" (DOLU/disabled, gray), "14:30", "15:00".
Bottom bar: left caption "Adım 2 / 3", right buttons: secondary "Geri" and primary "Devam et". Brand #1B5493.
```

---

#### Ekran 8 — Randevu Al · Adım 3 (Onay özeti)
*Üretir: seçilen randevunun özet kartı + onay butonu.*
```
Use the PATIENT SHELL with "Randevu al" active. Same page title and stepper, now steps 1 and 2 completed (brand circles with checks) and step 3 "Onay" ACTIVE.
A white card titled "Randevu özeti". Inside, an inset panel (background #EEF2F6, radius 10) laid out horizontally: a large mono time "09:30" in brand blue, then bold "Uzm. Dr. Ayşe Demir" and a secondary line "Kardiyoloji · Cum 24 Tem 2026". Below the panel a small secondary text: "Onay ve hatırlatma e-postaları hesabınıza bağlı adrese gönderilir."
Bottom bar: left caption "Son adım", right buttons: secondary "Geri" and primary "Randevuyu onayla". Brand #1B5493.
```

---

#### Ekran 9 — Randevularım (dolu)
*Üretir: 3 sekmeli randevu listesi, rozetler, randevu kodu, aksiyon butonları.*
```
Use the PATIENT SHELL with "Randevularım" active. Page H1 "Randevularım".
A white card (no inner padding) containing a tab bar with three tabs: "Yaklaşan" (ACTIVE), "Geçmiş", "İptal edilen". Under it, a list of appointment rows separated by soft dividers. Each row: a mono time in brand blue on the left, then bold doctor name and a caption line "department · date · CODE" where the code is small mono like "RND-2026-0007", then a status badge, then an action button on the right:
- "09:30" · "Uzm. Dr. Ayşe Demir" · "Kardiyoloji · 24 Tem 2026 · RND-2026-0007" · green badge "Onaylandı" · danger small button "İptal et".
- "11:00" · "Doç. Dr. Mehmet Kaya" · "Dermatoloji · 27 Tem 2026 · RND-2026-0011" · green badge "Onaylandı" · danger small button "İptal et".
Clean, scannable list. Brand #1B5493.
```

---

#### Ekran 10 — Randevularım (boş durum)
*Üretir: aynı ekranın boş hâli.*
```
Use the PATIENT SHELL with "Randevularım" active. Page H1 "Randevularım". A white card with the three tabs "Yaklaşan" (ACTIVE), "Geçmiş", "İptal edilen". Instead of a list, a centered empty-state message in muted text: "Bu görünümde randevu yok." Keep it calm and minimal, plenty of whitespace. Brand #1B5493.
```

---

#### Ekran 11 — İletişim
*Üretir: iki kolon — sol mesaj formu, sağ hastane bilgi kartı + harita.*
```
Use the PATIENT SHELL with "İletişim" active. Page H1 "İletişim" with subline "Sorunuz mu var? Mesaj bırakın ya da hastanemizi ziyaret edin."
Two equal-height columns:
LEFT: a white card titled "Bize yazın" containing an input labeled "Konu" (placeholder "ör. Randevu değişikliği hakkında"), a large textarea labeled "Mesajınız" (placeholder "Mesajınızı buraya yazın…") with a "0/2000" counter hint, a small caption "Yanıt, hesabınıza bağlı e-posta adresine gönderilir." and a primary button "Gönder" with a mail icon.
RIGHT (stacked): a white card titled "DocTick Hastanesi" with four info rows, each a rounded soft-blue icon tile + label + value: (map pin) "Adres" / "Kızılay Mah. Atatürk Bulvarı No:1, Çankaya / Ankara"; (clock) "Çalışma saatleri" / "Hafta içi 09:00 – 17:00"; (phone) "Telefon" / "+90 (312) 000 00 00"; (mail) "E-posta" / "iletisim@doctick.example". Below it a map card (embedded map look) with a footer row showing the address and a link "Yol tarifi al →". Brand #1B5493.
```

---

### B · Admin

---

#### Ekran 12 — Genel Bakış (dashboard)
*Üretir: 4 istatistik kutusu + bugünün randevuları listesi.*
```
Use the ADMIN SHELL with "Genel bakış" active. Main content: H1 "Genel bakış". A row of four equal stat cards, each with a big Sora number in brand blue and a small secondary label under it:
- "128" / "Bu haftaki randevu"
- "5" / "Açık bölüm"
- "6" / "Aktif doktor"
- "3" / "Onay bekleyen kullanıcı"
Below, a white card titled "Bugünün randevuları" (no inner padding) with appointment rows separated by dividers: each row a mono time in brand blue, then bold doctor name and a caption "department · patient email", then a status badge on the right:
- "09:30" · "Uzm. Dr. Ayşe Demir" · "Kardiyoloji · elif.yurt@gmail.com" · green "Onaylandı".
- "10:00" · "Doç. Dr. Mehmet Kaya" · "Dermatoloji · ahmet.can@gmail.com" · green "Onaylandı".
- "11:30" · "Uzm. Dr. Elif Şahin" · "Nöroloji · zeynep.ak@gmail.com" · red "İptal edildi".
Clean admin dashboard. Brand #1B5493.
```

---

#### Ekran 13 — Bölümler (liste)
*Üretir: bölüm tablosu, doktor sayısı, "Randevuya açık" toggle, sil.*
```
Use the ADMIN SHELL with "Bölümler" active. Main content: a header row with H1 "Bölümler" on the left and a small primary button "Bölüm ekle" (with a plus icon) on the right.
A white table-style card. Column header row in small uppercase overline muted text: "BÖLÜM", "DOKTOR", "RANDEVUYA AÇIK", and an empty action column. Then rows separated by dividers, each: a bold department name (H3), a "N doktor" count in secondary text, a toggle switch (on = brand), and a trash icon button:
- "Kardiyoloji" · "3 doktor" · toggle ON · trash
- "Dermatoloji" · "2 doktor" · toggle ON · trash
- "Nöroloji" · "1 doktor" · toggle OFF · trash
- "Ortopedi" · "0 doktor" · toggle ON · trash
Brand #1B5493.
```

---

#### Ekran 14 — Bölüm ekle (modal)
*Üretir: Ekran 13 üzerinde açılmış "Bölüm ekle" diyaloğu.*
```
Use the ADMIN SHELL with "Bölümler" active, the departments table dimmed behind a modal overlay. Center a modal dialog (white card, radius, soft shadow) titled "Bölüm ekle". Body: one input labeled "Bölüm adı" with placeholder "ör. Nöroloji". Footer: a secondary button "Vazgeç" and a primary button "Ekle" on the right. Brand #1B5493.
```

---

#### Ekran 15 — Doktorlar (liste)
*Üretir: avatar'lı doktor listesi, açık/kapalı rozet, düzenle & sil.*
```
Use the ADMIN SHELL with "Doktorlar" active. Header row: H1 "Doktorlar" left, small primary button "Doktor ekle" (plus icon) right.
A white card list, rows separated by dividers. Each row: a round soft-blue avatar with a user icon, then bold doctor name (H3) with a small department caption under it, then a status badge, then two icon buttons (pencil = edit, trash = delete):
- avatar · "Uzm. Dr. Ayşe Demir" / "Kardiyoloji" · green badge "Randevuya açık" · edit, delete
- avatar · "Doç. Dr. Mehmet Kaya" / "Dermatoloji" · green badge "Randevuya açık" · edit, delete
- avatar · "Uzm. Dr. Elif Şahin" / "Nöroloji" · gray badge "Kapalı" · edit, delete
Brand #1B5493.
```

---

#### Ekran 16 — Doktor ekle/düzenle (modal)
*Üretir: Ekran 15 üzerinde "Doktor ekle" diyaloğu (ad + bölüm).*
```
Use the ADMIN SHELL with "Doktorlar" active, the list dimmed behind a modal overlay. Center a modal dialog titled "Doktor ekle". Body (stacked): an input labeled "Ad soyad (unvanla)" with placeholder "ör. Uzm. Dr. Ali Veli"; a select labeled "Bölüm" with placeholder "Bölüm seçin". Footer: secondary "Vazgeç" + primary "Ekle". Brand #1B5493.
```

---

#### Ekran 17 — Çalışma Planı / Randevu saatleri (haftalık ızgara)
*Üretir: doktor seçici + 7 gün × 10 saat açık/kapalı ızgara.*
```
Use the ADMIN SHELL with "Randevu saatleri" active. Header row: H1 "Randevu saatleri" left, and a doctor select on the right showing "Uzm. Dr. Ayşe Demir".
A white card titled "Haftalık plan" with a small right caption "Hücreye tıklayın: açık ↔ kapalı". Inside, a grid: the first column is day labels ("Pzt","Sal","Çar","Per","Cum","Cmt","Paz") down the left; the top row is time labels in small mono across the top ("09:00","09:30","10:00","10:30","11:00","11:30","13:30","14:00","14:30","15:00"). Each cell is a small rounded square toggle: OPEN cells are light blue (#D8E6F7) with a brand check mark, CLOSED cells are gray sunken (#EEF2F6) and empty. Weekdays mostly open, weekend (Cmt/Paz) mostly closed. Bottom-right a small primary button "Planı kaydet". Brand #1B5493.
```

---

#### Ekran 18 — Kullanıcılar (Onayla/Reddet)
*Üretir: kullanıcı listesi, statü rozetleri, duruma göre aksiyonlar.*
```
Use the ADMIN SHELL with "Kullanıcılar" active. Main content: H1 "Kullanıcılar".
A white table-style card. Column header overline row: "KULLANICI", "DURUM", and an action column. Rows separated by dividers, each: a round soft-blue avatar, bold name (with " · ADMİN" suffix if admin) and an email caption; a status badge; and action buttons depending on status:
- avatar · "Elif Yurt" / "elif.yurt@gmail.com" · amber badge "Onay bekliyor" · primary button "Onayla" (check icon) + danger button "Reddet".
- avatar · "Ahmet Can" / "ahmet.can@gmail.com" · green badge "Aktif" · secondary button "Pasife çek" + trash icon.
- avatar · "Taha Keskin · ADMİN" / "tahakeskin06@hotmail.com" · green badge "Aktif" (no delete on self).
- avatar · "Zeynep Ak" / "zeynep.ak@gmail.com" · red badge "Reddedildi" · primary button "Aktifleştir" + trash icon.
Brand #1B5493.
```

---

#### Ekran 19 — E-posta ayarları
*Üretir: sol bildirim anahtarları, sağ hatırlatma e-posta önizlemesi.*
```
Use the ADMIN SHELL with "E-posta ayarları" active. Main content: H1 "E-posta ayarları". Two side-by-side cards:
LEFT card titled "Bildirimler": a stack of toggle rows — "Randevu onayı e-postası" (ON, disabled/always-on look), "Randevu hatırlatma e-postası" (ON), then a select "Hatırlatma zamanı" showing "24 saat önce", then "İptal bilgilendirme e-postası" (ON, disabled look), then a small primary button "Kaydet".
RIGHT card titled "Hatırlatma şablonu — önizleme": an email preview inside a bordered rounded box — a #164478 header strip with white "DocTick" wordmark, then a body: bold "Randevunuzu hatırlatırız", a line "Sayın Elif Yurt, yaklaşan randevunuz:", an inset panel (#EEF2F6) with mono "09:30" in brand blue and "Uzm. Dr. Ayşe Demir · Kardiyoloji · 24 Tem 2026, Cum", and a closing line "İptal için randevudan en az 2 saat önce işlem yapın." Brand #1B5493.
```

---

### C · Durum

---

#### Ekran 20 — Randevu iptal onayı (Dialog)
*Üretir: Randevularım üzerinde açılmış iptal onay diyaloğu.*
```
Use the PATIENT SHELL with "Randevularım" active, the appointments list dimmed behind a modal overlay. Center a modal dialog titled "Randevuyu iptal et". Body text: "24 Tem 2026, 09:30 — Uzm. Dr. Ayşe Demir randevunuz iptal edilecek. İptal bilgisi e-posta ile gönderilir." (the time "09:30" styled in mono). Footer: a secondary button "Vazgeç" and a danger button "İptal et" on the right. Brand #1B5493.
```

---

## 4) İterasyon cümleleri (çıktı sapınca yapıştır)

- Renk kaydıysa: `Use exactly #1B5493 as the primary/brand color and #164478 for the header/sidebar. Do not use teal or purple.`
- Font yanlışsa: `Use "Sora" for all headings and "IBM Plex Sans" for body text; times and codes in "IBM Plex Mono".`
- Fazla süs eklediyse: `Remove any extra sections, illustrations or marketing copy that I did not specify. Keep only the elements listed.`
- Türkçe metni değiştirdiyse: `Keep every visible text string exactly as I wrote it, in Turkish. Do not translate or paraphrase.`
- Yerleşim bozulduysa: `Match the layout description exactly: same order, same columns, same card structure.`
- Daha sade ist/görsel: `Increase whitespace, use subtle shadows, keep it minimal and clinical.`

---

## 4b) Üst menü + footer toplu düzeltme (hazır prompt)

Üst menüsü yanlış (Hakkımızda/Departmanlar/Doktorlar/SSS) veya footer'ı olan **her hasta ekranına** bunu yapıştır:

```
Replace the entire top navigation bar on this screen with the correct DocTick app header, and delete the footer. Do not change any other content on the page.

The top header bar spans full width, background is EXACTLY #164478 (deep navy), about 58px tall, sticky at the top. Its contents, left to right:
- the white "DocTick" logo (a small medical cross/tick mark + wordmark),
- then exactly these four white navigation links, in this order: "Ana sayfa", "Randevu al", "Randevularım", "İletişim",
- on the far right: a white user icon, the name "Elif Yurt", and a small white outline logout icon.
Highlight as active (a subtle translucent-white rounded pill) only the link that matches this page (e.g. on a "Randevu al" page, highlight "Randevu al").

The header must NOT contain "Hakkımızda", "Departmanlar", "Doktorlar", "SSS", a "Giriş Yap" button, or a mobile hamburger menu.

Delete the footer at the bottom of the page entirely (no "© 2024 DocTick", no Gizlilik/Kullanım/İletişim links). The page ends after the main card.
```

Admin ekranları için aynısını sol menü (ADMIN SHELL) diliyle uyarlayabilirsin; genelde admin'de bu sorun çıkmaz.

## 5) Ekran listesi (özet)

| # | Ekran | Kabuk |
|---|-------|-------|
| 1 | Landing / Giriş (hero) | — |
| 2 | Google ile giriş anı | — |
| 3 | Onay bekliyor | — |
| 4 | Reddedildi | — |
| 5 | Hasta Ana Sayfa | Patient |
| 6 | Randevu Al · Adım 1 (Bölüm & doktor) | Patient |
| 7 | Randevu Al · Adım 2 (Tarih & saat) | Patient |
| 8 | Randevu Al · Adım 3 (Onay) | Patient |
| 9 | Randevularım (dolu) | Patient |
| 10 | Randevularım (boş) | Patient |
| 11 | İletişim | Patient |
| 12 | Genel Bakış (dashboard) | Admin |
| 13 | Bölümler (liste) | Admin |
| 14 | Bölüm ekle (modal) | Admin |
| 15 | Doktorlar (liste) | Admin |
| 16 | Doktor ekle/düzenle (modal) | Admin |
| 17 | Randevu saatleri (haftalık ızgara) | Admin |
| 18 | Kullanıcılar | Admin |
| 19 | E-posta ayarları | Admin |
| 20 | Randevu iptal onayı (Dialog) | Patient |

*Kaynak: `frontend/src/styles/tokens/*`, `frontend/src/pages/*`, `CONTEXT.md`. Örnek isim/e-posta/tarihler temsilîdir; istediğin gibi değiştir.*
