# Mobilde 9:16 Hero Video — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans`. Adımlar checkbox (`- [ ]`) ile takip edilir. Bu plan **yalnız landing hero videosunun mobil sürümüyle** ilgilidir; doktor fotoğrafları (`2026-07-30-doktor-fotograflari-sunucu-tarafi.md`) ve e-posta (`2026-07-30-eposta-gercek-aliciya.md`) işleri ayrı planlarda — o dosyalara dokunma.

**Goal:** Dikey ekranda (telefon) landing sayfasının arka plan videosu 9:16 sürüm olsun; masaüstü 16:9'da kalsın. Sunucuya ve isteğe ek yük gelmesin.

**Sonuç (kullanıcının asıl sorusu — "daha fazla yük olmasın"):** Çalışma zamanı maliyeti **sıfır**. Ek istek, ek JS, ek CSS, backend değişikliği yok — telefon iki videodan yalnız birini indirir. Üstelik mobil **bugünden daha az** byte indirir: 12.15 MiB → ~6–7 MiB (tahmin). Tek maliyet: bir kerelik offline ffmpeg encode'u.

**Tech Stack:** React 19 + Vite 8 · GSAP ScrollTrigger scroll→`currentTime` scrub · ASP.NET Core statik dosya servisi

---

## Mevcut durum (kodda + dosyalarda doğrulandı)

| Gerçek | Yer / kanıt |
|---|---|
| Hero video tek yerden geliyor: `<ScrollVideo src="/media/doctick-hero.mp4" />` | `frontend/src/pages/common/Login.tsx:172` |
| `ScrollVideo` `src`'i doğrudan `<video src>`'e veriyor, kaynak seçimi yok | `frontend/src/components/scroll/ScrollVideo.tsx:132` |
| Video CSS'i zaten oran-bağımsız: `object-fit:cover` + %108 taşma | `frontend/src/styles/landing.css:11` |
| Dosya iki yerde duruyor (ikisi de aynı): `frontend/public/media/`, `backend/wwwroot/media/` | `ls` ile doğrulandı, ikisi de 12.15 MiB |
| Yayınlanan hero = kökteki `videoyu_sonunda_gözüken_tik_iş_60fps.mp4`'ün aynısı | Aynı boyut + aynı atom parmak izi |
| Service worker mp4'ü **önbelleğe almıyor** | `backend/wwwroot/sw.js` içinde "mp4" geçmiyor (workbox varsayılan `globPatterns`'te mp4 yok, 2 MiB üst sınırı da var) |
| Sistemde ffmpeg **yok** | `where ffmpeg` boş; 07-22'de kullanılan `TEMP\ffmpeg-bin` silinmiş |

### Video özellikleri (mp4 atom'larından okundu)

| Dosya | Çözünürlük | fps | Süre | Kare | **Keyframe** | Ses | Boyut |
|---|---|---|---|---|---|---|---|
| `media/doctick-hero.mp4` (mevcut) | 1280×720 | 59.99 | 7.83s | 470 | **470 (all-intra)** | yok | 12.15 MiB |
| `Downloads/9_16.mp4` (yeni) | 1080×1920 | 30.00 | 7.87s | 236 | **2** | AAC var | 17.69 MiB |

---

## Kritik bulgu: `9_16.mp4` olduğu gibi kullanılamaz

`ScrollVideo` bir oynatıcı değil, **scrub**'dır: her RAF karesinde scroll konumunu `video.currentTime`'a yazar (`ScrollVideo.tsx:74-77`). Bir `currentTime` ataması, tarayıcıyı **en yakın önceki keyframe'den** hedef kareye kadar decode etmeye zorlar.

- Mevcut hero: 470 kare / 470 keyframe → her seek **1 kare** decode eder. Bu tesadüf değil; 07-22'de bilerek `-g 1 -bf 0` ile all-intra encode edildi (`memory/sessions/2026-07-22.jsonl`, "seek-friendly for currentTime scrub").
- `9_16.mp4`: 236 kare / **2** keyframe → ortalama keyframe aralığı ~118 kare. Videonun ortasına yapılan bir seek, ~4 saniyelik görüntüyü decode etmek demek. Telefon decoder'ında bu, her scroll hareketinde gözle görülür donma üretir; `seekingRef` kapısı (satır 74) seek'leri sıraya sokmadığı için sonuç "video scroll'u takip etmiyor" olarak görünür.

**Yani dosya kullanılacak, ama aynı tarifle yeniden encode edilerek.** Ham hâliyle kopyalamak, mobilde bugünkünden kötü bir deneyim verir.

## Reddedilen alternatif: mevcut 16:9'u otomatik 9:16'ya kırpmak

Kullanıcının sorduğu ikinci seçenek. Ölçtüm, olmaz:

- 1280×720'den 9:16 kırpmak → `crop=405:720`, yani **genişliğin %31.6'sı** kalır. 720 px genişliğe upscale edilirse yumuşak/bulanık olur.
- Kadraj da bozulur: klinikte selamlayan doktor çekimi yatay kompozisyonlu; merkezden 405 px kesmek özneyi ya kırpar ya da sondaki tik animasyonunu kadraj dışına atar. Sabit `crop` bunu bilemez, akıllı yeniden kadrajlama ise bu iş için fazlasıyla ağır.
- Elde amaca özel çekilmiş gerçek bir 9:16 dosya varken kırpma seçeneği zaten gereksiz (YAGNI).

---

## Hedef encode

`doctick-hero-9x16.mp4` — **720×1280, 30 fps, sessiz, all-intra**.

Neden bu parametreler:

| Karar | Gerekçe |
|---|---|
| 720×1280 (1080×1920 **değil**) | All-intra maliyeti piksel/saniye ile doğrusal. Mevcut hero 55.3 Mpx/s → 12.15 MiB. 1080×1920@30 = 62.2 Mpx/s → ~14 MiB (mobil veride kabul edilemez). 720×1280@30 = 27.6 Mpx/s → **~6–7 MiB tahmin**. Telefon ekranı ~390 CSS px ve videonun üstünde ağır bir scrim var (`landing.css:13`); 720 px genişlik fazlasıyla yeterli. |
| 30 fps korunur | Kaynak 30 fps. 60'a çıkarmak `minterpolate` demek (07-22'de 24→60 için kullanıldı) — hem uzun bir işlem hem 2× dosya boyutu. Kullanıcının "daha fazla yük oluşturmadan" isteğine aykırı. Scrub'da 30 fps yeterli akıcılıkta. |
| `-an` (ses atılır) | `<video muted>` (`ScrollVideo.tsx:134`) — ses hiç çalmıyor. Şu an ~1.4 MiB boşa inen byte + gereksiz decoder. |
| `-g 1 -bf 0` all-intra | Yukarıdaki kritik bulgu. Mevcut hero ile aynı tarif. |
| `-movflags +faststart` | moov atom başa alınır; `preload="auto"` ilk byte'lardan metadata okuyabilir. |

Referans komut (uygulama sırasında çalıştırılacak, şimdi yazılmıyor):

```
ffmpeg -i 9_16.mp4 -vf scale=720:1280 -c:v libx264 -preset slow -crf 20 \
       -g 1 -bf 0 -pix_fmt yuv420p -an -movflags +faststart doctick-hero-9x16.mp4
```

**Kaçış planı:** çıktı >8 MiB gelirse önce `-crf 23`, yetmezse `scale=608:1080`. >10 MiB ile ilerlenmez.

---

## Kaynak seçimi: tek satır, doğru yerde

**TUZAK — `<source media="...">` KULLANMA.** `media` niteliği HTML spec'inde yalnız `<picture>` için tanımlı; `<video>` içindeki `<source>` üzerinde tarayıcılar güvenilir şekilde uygulamıyor (Chrome desteği kaldırdı). Sessizce yanlış dosyayı seçer, hatayı ancak gerçek telefonda görürsün. Ayrıca `ScrollVideo`'nun `src`/`onError` akışını da değiştirmek gerekirdi.

Yapılacak: `Login.tsx:172`'de tek satırlık `matchMedia` seçimi.

- Ölçüt **oran**, genişlik değil: `(max-aspect-ratio: 1/1)`. Yatay tutulan telefon 16:9 dosyayı alır — doğrusu bu.
- `ScrollVideo.tsx`'e dokunulmaz. `landing.css`'e dokunulmaz (`object-fit:cover` iki oranı da halleder).
- Tek indirme garantisi: `<video>`'ya yalnız bir `src` verilir, ikinci dosya hiç istenmez.
- **ponytail ceiling:** `matchMedia` mount'ta bir kez okunur; oturum ortasında telefonu çevirmek dosyayı değiştirmez. Kabul edilebilir — `cover` kırpması yine düzgün görünür, üstelik scroll ortasında kaynak değiştirmek indirmeyi baştan başlatır ve scrub'ı sıfırlar. Gerekirse yükseltme yolu: `resize` dinleyip `src`'i `key` ile yeniden mount etmek.

---

## Dosya Haritası

| Dosya | Sorumluluk | Görev |
|---|---|---|
| `frontend/public/media/doctick-hero-9x16.mp4` | dev sunucusu + `vite build` çıktısı | 2 |
| `backend/wwwroot/media/doctick-hero-9x16.mp4` | yayınlanan uygulamanın servis ettiği dosya | 2 |
| `frontend/src/pages/common/Login.tsx:172` | oran'a göre `src` seçimi (tek satır) | 3 |
| `frontend/src/components/scroll/ScrollVideo.tsx:7` | *(opsiyonel)* `SEEK_THRESHOLD` | 5 |

Değişmeyecekler: `landing.css`, `vite.config.ts` (PWA/workbox), `DocTick.Api.csproj`, backend kodu.

---

## Görevler

- [x] **0. ffmpeg edin.** `winget install Gyan.FFmpeg` ya da taşınabilir zip (07-22'de olduğu gibi). Doğrula: `ffmpeg -version`.
- [x] **1. Encode.** Yukarıdaki komutu `Downloads/9_16.mp4` üzerinde çalıştır. **Doğrulama:** probe çıktısında (a) kare sayısı == keyframe sayısı, (b) ses izi yok, (c) 720×1280, (d) boyut ≤8 MiB. Ayrıca videoyu bir kez gözle izle: sondaki tik animasyonu 16:9 sürümle aynı anda mı bitiyor? (`dt-climax` bölümü buna göre kurgulanmış.)
- [x] **2. Yerleştir.** Çıktıyı `frontend/public/media/` **ve** `backend/wwwroot/media/` içine kopyala. (csproj'da otomatik kopyalama adımı yok — ikisi elle tutuluyor.)
- [x] **3. Seçim satırı.** `Login.tsx`'te oran'a göre `src`. Tek satır, yeni dosya yok, yeni prop yok.
- [x] **4. Doğrula (asıl kontrol burada).** `npm run dev` → DevTools cihaz araç çubuğu, iPhone dikey: Network sekmesinde **yalnız** `doctick-hero-9x16.mp4` inmeli (16:9 hiç istenmemeli); sayfayı baştan sona kaydır, video scroll'u takip etmeli, donma olmamalı. Sonra masaüstü genişliği → yalnız `doctick-hero.mp4`. Mümkünse gerçek telefonda bir tur (emülatör decoder'ı gerçek telefondan iyimserdir).
- [x] **5. (Opsiyonel, tek satır) `SEEK_THRESHOLD`.** Sabit `1/60`, 30 fps kaynakta kare altı seek'leri tetikler. Ölümcül değil — `seekingRef` kapısı yığılmayı zaten önlüyor — ama istenirse prop'a çıkarılıp mobil için `1/30` verilir. 4. adımda scrub akıcıysa **atla**.
- [x] **6. memkraft kaydı** (CLAUDE.md zorunlu kuralı): `mk.log_event` (encode parametreleri + ölçülen boyut) + `mk.fact_add` (mobil hero kaynağı) + `mk.update("DocTick", ...)`.

## Kapsam dışı

- Poster görseli (şu an hiç kullanılmıyor, `overlay` yükleme katmanı bu işi görüyor).
- Tablet için üçüncü bir oran. İki dosya yeter.
- Videoyu SW ile önbelleğe almak. Bilerek yapılmıyor: 6+ MiB'lık kalıcı önbellek, tarayıcının HTTP önbelleğinin zaten yaptığı işi tekrar eder.
