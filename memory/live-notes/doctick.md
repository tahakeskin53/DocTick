---
tier: core
---
# DocTick (Live Note)

**Tier: core**

> 🔄 Auto-tracked — updates automatically as new information arrives

## Tracking Config
- **Type:** project
- **Started:** 2026-07-21
- **Last Update:** 2026-07-30
- **Last Accessed:** 2026-07-21 14:59:18
- **Update Count:** 30
- **Source:** setup

## Current State
(Latest information accumulates here)

## Recent Activity
- **2026-07-30** | PERF (2026-07-30, dal perf/login-to-home): (1) index.html'de klasik script /api/auth/me + /api/appointments'i bundle inerken baslatir, client.ts takeBoot() ile tek seferlik devralir. Node 24 tip-siyirma modu parameter property kabul etmedigi icin ApiError duz atamaya cevrildi (yoksa client.ts hicbir Node testinden import edilemez). (2) AddResponseCompression: text/javascript ELLE eklenmeli — Kestrel .js'i text/javascript servis eder ama varsayilan MIME listesinde yalnizca application/javascript var, yoksa sikistirma sessizce calismaz. (3) TUZAK: StaticFileOptions UseStaticFiles'a inline verilirse MapFallbackToFile ayari DI'dan okudugu icin /, /login, /randevularim no-cache ALMAZ; yalnizca /index.html alir. Immutable /assets ile birlikte deploy'lari ulastirmaz. (4) AuthAudit dosya yazimi Task.Run'a alindi; HttpContext ve GetCurrentDirectory SENKRON okunmali. (5) UserGate 15 sn TTL; invalidasyon AdminEndpoints approve/reject/delete + AuthEndpoints /google (admin yukseltme ve on-onayli aktivasyon dallari — plan bunu atlamisti). (6) ActiveGuard filtresi KALDIRILMADI: claim tabanli policy Reject->Active ve Approve->Pending gecislerinde yanlis cevap veriyor. (7) Workbox /api/appointments NetworkFirst cache KALDIRILDI: kullanicidan bagimsiz ve kaliciydi, hesap degisince oncekinin listesini servis ediyordu. Offline liste istenirse cache adi kullanici kimligiyle anahtarlanmali. [Source: perf]
- **2026-07-30** | SIZINTI SINIFI (tekrar etmesin): kullaniciya ozel veri, kullaniciya ozel OLMAYAN anahtarlarda onbellekleniyordu. Iki yer: (1) main.tsx'teki tek QueryClient sayfa omru boyunca yasiyor, ['appts'] anahtari herkeste ayni; cikis sadece setUser(null) yapiyordu, giris de Login.tsx'te setUser ile tam sayfa yenilemesiz oldugu icin yeni hesap oncekinin randevularini goruyordu (staleTime 30sn boyunca istek bile atmadan). (2) SW runtime cache 'appointments' NetworkFirst, kullanicidan bagimsiz ve diskte kalici. Backend suclu DEGILDI: PatientEndpoints.cs zaten .Where(a => a.UserId == uid) yapiyor. Duzeltme kimlik SINIRINA konuldu (AuthProvider), cagri yerlerine degil; ilk giriste (null -> A) bilerek temizlenmiyor cunku index.html boot istegini iptal edip perf kazancini geri goturuyor. [Source: bugfix]
- **2026-07-30** | Azure deploy tuzagi: portable (RID'siz) `dotnet publish` zip'e bos dizin girdileri koyar (runtimes/browser-wasm/ vb.); Kudu'nun parallel rsync'i bunlarda 'failed to stat' + exit 23 verip deploy'u 400 ile dusurur. Cozum: `dotnet publish -c Release -r linux-x64 --self-contained false` + zip'i yalnizca gercek dosyalarla uret (69 girdi). Ayrica Kudu VFS'te basic publishing creds kapali -> AAD Bearer token gerekir, VFS koku zaten /home (yani /api/vfs/, /api/vfs/home/ degil). [Source: deploy]
- **2026-07-29** | AdminApptDto artik Date + DoctorId tasiyor. GET /api/admin/appointments (date parametresiz) tum randevulari doner; donem filtresi ve doktor gruplamasi frontend tarafinda (frontend/src/pages/admin/periodRange.ts + Appointments.tsx). Admin menusunde eski "Randevu saatleri" etiketi "Calisma saatleri" oldu; kafa karisikliginin kaynagi oydu. Overview /overview artik bugun ve sonrasi ilk 10 randevuyu doner (string CompareTo, SQLite native cevriliyor - testle dogrulandi). [Source: implementation]
- **2026-07-28** | Hosting kararı: GitHub Pages elendi (statik-only, .NET+SQLite+BackgroundService çalıştıramaz). Azure App Service Linux B1 seçildi — Free F1 özel domain ve Always On desteklemiyor, Always On ReminderService BackgroundService icin zorunlu. Iki prod-blocker tespit edildi: (1) DateTime.Now her yerde kullanılıyor, Azure UTC calisir, TZ=Europe/Istanbul app setting ile cozulur (kod degisikligi yok); (2) SQLite doctick.db calisma dizininde, her deploy silinir, ConnectionStrings__Default=/home/data/doctick.db ile kalici alana tasinir. Plan: docs/12-azure-deployment.md [Source: planning]
- **2026-07-24** | Yeni repo DocTick-VercellApp (staj projeler altinda, orijinal DocTick dokunulmadi): sadece frontend + mock veri, Vercel-ready. Karar: frontend demo (hibrit degil). [Source: vercel-demo]
- **2026-07-24** | Vercel demo karari: .NET backend Vercel de calismadigi icin yalnizca frontend + localStorage mock. Kullanici hibrit yerine demo secti. [Source: plan]
- **2026-07-24** | DocTick-Test (ayri repo) cift-tikla-calisir sekilde yeniden yapildi: pre-build wwwroot -> build asamasi yok; .NET-only launcher; her OS klasorunde TEK baslatici; baslatWINDOWS.bat/_kurulum.bat/BASLA.md/CONTEXT.md/.slnx silindi. Auth:AutoApprove=true (herkes aninda onayli). Ana DocTick etkilenmedi (test ayarlari yalnizca DocTick-Test'te). [Source: release]
- **2026-07-24** | DocTick-Test push tamam (2026-07-24): https://github.com/tahakeskin53/DocTick-Test (private, main). Ana proje revert edildi ve dogrulandi; test ayarlari yalnizca bu repoda. [Source: test-repo-push]
- **2026-07-24** | DocTick-Test test deposu kuruldu (2026-07-24): juri icin mac/windows ayrilmis, test=otomatik onay+self-bootstrap. Ana proje revert edildi ve 4-ajanli workflow ile dogrulandi (test ayarlari ana projede YOK). Yerel commit 9227e83; push gh auth bekliyor. [Source: test-repo-setup]
- **2026-07-24** | Onboarding/juri teslimi tamam (2026-07-24): Windows launcher'lar artik _kurulum.bat ile yoneticisiz Node+.NET kuruyor; Auth:AutoApprove=true (her giris aktif Hasta); BASLA.md eklendi, README '2 anahtar' bolumu 'anahtar gerekmez' olarak duzeltildi; temiz ZIP icin git archive allowlist BASLA.md'de. Backend derlemesi TAMAM (kod hatasi yok; MSB3027 yalnizca calisan DocTick.Api.exe dosya kilidinden). [Source: onboarding-setup]
- **2026-07-23** | Stitch mockup asamasi: birkac ekran uretildi ve kabuk sapmasi cozuldu. Kullanici deliverable/fonksiyonellik sorusuna geldi. Onemli: gercek DocTick zaten calisan uygulama (React+.NET); Stitch mockup'lari 'tasarim asamasi' artefakti, fonksiyonel olmasi gerekmez. Fonksiyonellik ya tiklanabilir Figma prototip (kodsuz) ya da mevcut gercek app. [Source: mockup]
- **2026-07-23** | E-POSTA COZUMU (2026-07-23): Resend__ApiKey User env var olarak set edildi (appsettings.json yer tutucu kaldi). Anahtar gecerli (Resend probe HTTP 422). Backend restart sonrasi iletim formu + tum e-posta ozellikleri calisir. Domain dogrulanmadigi icin posta tahakeskin06@hotmail.com'a yonlenir (RedirectTo). Teslimden once anahtar rotate edilmeli (git gecmisinde vardi). [Source: debug-session]
- **2026-07-23** | Google Stitch mockup brief hazirlandi (20 ekran, hasta+admin). Yaklasim: guclu global stil blogu + birebir Turkce icerikli per-ekran promptlar; gerekirse vitrin ekranlar icin screenshot referansi eklenir. Auth engeli: ic ekranlar /me'ye bagli, Google OAuth bekleyen config -> canli screenshot zor. [Source: mockup]
- **2026-07-23** | BILINEN DURUM (2026-07-23): E-posta alt sistemi calismiyor — Resend:ApiKey appsettings.json'da yer tutucu 're_BURAYA_KENDI_RESEND_ANAHTARINIZ', runtime env var Resend__ApiKey set degil. Iletisim formu + randevu onay/iptal/hatirlatma + hesap onay postalari 502 doner. Cozum: Resend'den yeni anahtar + [Environment]::SetEnvironmentVariable('Resend__ApiKey','re_...','User') + backend restart. Kod dogru, sadece config eksik. [Source: debug-session]
- **2026-07-23** | PWA TAMAM ve kullanici tarafindan dogrulandi: DocTick_App.bat ile kurulabilir PWA calisiyor (build+wwwroot+5080 tek origin), offline Randevularim, autoUpdate, Google auth 5080 ile calisir. Kalan opsiyonel: HTTPS deploy + magaza paketleme (spec 9). [Source: dogrulama]
- **2026-07-23** | PWA implementasyonu TAMAMLANDI (frontend/ icine uygulandi, ayri DocTick-App klasoru YAPILMADI). build -> dist -> backend/wwwroot kopyasi -> dotnet publish ile tek origin. Kalan: kullici elle kurulum/offline test (browser) + public HTTPS deploy sonrasi magaza paketleme. [Source: implementasyon]
- **2026-07-23** | PWA plani hazir (6 gorev): ikonlar, check_pwa.mjs, vite-plugin-pwa config, offline banner/buton kilidi, backend statik servis + SPA fallback (Program.cs'te henuz yok!), e2e dogrulama. Uygulama beklemede. [Source: planning]
- **2026-07-23** | Giris hatasinin kok nedeni: baslatWINDOWS.bat tarayiciyi backend hazir olmadan aciyordu (Vite --open) -> frontend acik/backend yok -> Giris basarisiz. Duzeltildi: scriptler artik backend saglik kontrolunu (GET localhost:5080/ 200) bekleyip ondan sonra tarayiciyi aciyor. Kullanici sadece baslatWINDOWS.bat calistirmali, elle backend baslatmaya gerek yok. [Source: startup-scripts-fix]
- **2026-07-23** | Giris hatalari artik backend/logs/auth-*.log JSONL dosyasina yaziliyor (login_success/token_invalid/config_error, sebep+ip+ua). Giris teskisinde ONCE bu dosyaya bak. Frontend Login.tsx artik gercek hatayi console.error ile basiyor (backend kapali gibi network hatalari icin). [Source: auth-audit-feature]
- **2026-07-23** | Cift randevu (ayni hasta+saat) bugi tespit ve cozum: koruma kodu hazir, lokal doctick.db silindi. Commitleme bekliyor. [Source: bugfix]
- **2026-07-23** | GitHub repo public yapildi (github.com/tahakeskin53/DockTick), secret taramasi temiz [Source: session]
- **2026-07-22** | Sinematik landing (/login) + Booking (/randevu-al) redesign tamamlandi; gsap 3.15.0 + lenis 1.3.25 dependency eklendi; ScrollVideo/SmoothScroll/AutoTour infra (components/scroll/) + lib/gsap.ts. Branch feat/landing-booking-redesign commit 3cb5d5e, main den dallandi (ff-merge bekliyor). npm run build yesil (tsc+vite, 164 modul). [Source: session]
- **2026-07-22** | Teknik teslim dokumantasyon katmani eklendi (Temmuz 2026): docs/ + kok CONTEXT.md + 7 ADR. README docs/ isaretcisi + olgusal duzeltmeler (admin email hotmail, 7 test, 420 haftalik slot). Resend anahtari yer tutucu. ERD/mimari Db.cs+Program.cs birebir dogrulandi. [Source: docs]
- **2026-07-21** | Hastane online randevu sistemi uygulamasi TAMAMLANDI ve GitHub'a pushlandi. Stack: backend ASP.NET Core 10 minimal API + EF Core/SQLite; frontend Vite 8 + React 19 + TS. Google OAuth (cookie), Resend e-posta (raw HttpClient), 5dk hatirlatma BackgroundService. Tasarim sistemi ('DocTick Design System/') frontend'e tasindi. 6 xunit testi geciyor. Calisma: backend localhost:5080, frontend 5173 (Vite /api proxy). BEKLEYEN: Google Client ID (frontend/.env.local + backend/appsettings.json aynisi) ve Resend API key (backend/appsettings.json) eklenmeli — gercek login/e-posta icin. [Source: agent]
- **2026-07-21** | mattpocock/skills katmani eklendi: skills.sh --copy ile 41 skill (.claude/skills/ + .agents/skills/), local-files issue tracker (.scratch/), docs/agents/ konfigurasyonu yazildi, CLAUDE.md'ye Agent skills bloğu eklendi [Source: setup]
- **2026-07-21** | Tech: project-local Python venv (.venv); git repo on main. [Source: seed]
- **2026-07-21** | Internship (staj) project. Memory layer managed by memkraft. [Source: seed]
- **2026-07-21** | memkraft memory layer added [Source: setup]
- **2026-07-21** | Tracking started [Source: setup]

## Key Points
(Key points are automatically summarized here)

## Related Entities
(Links auto-populated as relationships are discovered)

## Open Threads
- [ ] Initial setup — enrichment needed

---

## Timeline (Full Record)

- **2026-07-30** | PERF (2026-07-30, dal perf/login-to-home): (1) index.html'de klasik script /api/auth/me + /api/appointments'i bundle inerken baslatir, client.ts takeBoot() ile tek seferlik devralir. Node 24 tip-siyirma modu parameter property kabul etmedigi icin ApiError duz atamaya cevrildi (yoksa client.ts hicbir Node testinden import edilemez). (2) AddResponseCompression: text/javascript ELLE eklenmeli — Kestrel .js'i text/javascript servis eder ama varsayilan MIME listesinde yalnizca application/javascript var, yoksa sikistirma sessizce calismaz. (3) TUZAK: StaticFileOptions UseStaticFiles'a inline verilirse MapFallbackToFile ayari DI'dan okudugu icin /, /login, /randevularim no-cache ALMAZ; yalnizca /index.html alir. Immutable /assets ile birlikte deploy'lari ulastirmaz. (4) AuthAudit dosya yazimi Task.Run'a alindi; HttpContext ve GetCurrentDirectory SENKRON okunmali. (5) UserGate 15 sn TTL; invalidasyon AdminEndpoints approve/reject/delete + AuthEndpoints /google (admin yukseltme ve on-onayli aktivasyon dallari — plan bunu atlamisti). (6) ActiveGuard filtresi KALDIRILMADI: claim tabanli policy Reject->Active ve Approve->Pending gecislerinde yanlis cevap veriyor. (7) Workbox /api/appointments NetworkFirst cache KALDIRILDI: kullanicidan bagimsiz ve kaliciydi, hesap degisince oncekinin listesini servis ediyordu. Offline liste istenirse cache adi kullanici kimligiyle anahtarlanmali. [Source: perf]

- **2026-07-30** | SIZINTI SINIFI (tekrar etmesin): kullaniciya ozel veri, kullaniciya ozel OLMAYAN anahtarlarda onbellekleniyordu. Iki yer: (1) main.tsx'teki tek QueryClient sayfa omru boyunca yasiyor, ['appts'] anahtari herkeste ayni; cikis sadece setUser(null) yapiyordu, giris de Login.tsx'te setUser ile tam sayfa yenilemesiz oldugu icin yeni hesap oncekinin randevularini goruyordu (staleTime 30sn boyunca istek bile atmadan). (2) SW runtime cache 'appointments' NetworkFirst, kullanicidan bagimsiz ve diskte kalici. Backend suclu DEGILDI: PatientEndpoints.cs zaten .Where(a => a.UserId == uid) yapiyor. Duzeltme kimlik SINIRINA konuldu (AuthProvider), cagri yerlerine degil; ilk giriste (null -> A) bilerek temizlenmiyor cunku index.html boot istegini iptal edip perf kazancini geri goturuyor. [Source: bugfix]

- **2026-07-30** | Azure deploy tuzagi: portable (RID'siz) `dotnet publish` zip'e bos dizin girdileri koyar (runtimes/browser-wasm/ vb.); Kudu'nun parallel rsync'i bunlarda 'failed to stat' + exit 23 verip deploy'u 400 ile dusurur. Cozum: `dotnet publish -c Release -r linux-x64 --self-contained false` + zip'i yalnizca gercek dosyalarla uret (69 girdi). Ayrica Kudu VFS'te basic publishing creds kapali -> AAD Bearer token gerekir, VFS koku zaten /home (yani /api/vfs/, /api/vfs/home/ degil). [Source: deploy]

- **2026-07-29** | AdminApptDto artik Date + DoctorId tasiyor. GET /api/admin/appointments (date parametresiz) tum randevulari doner; donem filtresi ve doktor gruplamasi frontend tarafinda (frontend/src/pages/admin/periodRange.ts + Appointments.tsx). Admin menusunde eski "Randevu saatleri" etiketi "Calisma saatleri" oldu; kafa karisikliginin kaynagi oydu. Overview /overview artik bugun ve sonrasi ilk 10 randevuyu doner (string CompareTo, SQLite native cevriliyor - testle dogrulandi). [Source: implementation]

- **2026-07-28** | Hosting kararı: GitHub Pages elendi (statik-only, .NET+SQLite+BackgroundService çalıştıramaz). Azure App Service Linux B1 seçildi — Free F1 özel domain ve Always On desteklemiyor, Always On ReminderService BackgroundService icin zorunlu. Iki prod-blocker tespit edildi: (1) DateTime.Now her yerde kullanılıyor, Azure UTC calisir, TZ=Europe/Istanbul app setting ile cozulur (kod degisikligi yok); (2) SQLite doctick.db calisma dizininde, her deploy silinir, ConnectionStrings__Default=/home/data/doctick.db ile kalici alana tasinir. Plan: docs/12-azure-deployment.md [Source: planning]

- **2026-07-24** | Yeni repo DocTick-VercellApp (staj projeler altinda, orijinal DocTick dokunulmadi): sadece frontend + mock veri, Vercel-ready. Karar: frontend demo (hibrit degil). [Source: vercel-demo]

- **2026-07-24** | Vercel demo karari: .NET backend Vercel de calismadigi icin yalnizca frontend + localStorage mock. Kullanici hibrit yerine demo secti. [Source: plan]

- **2026-07-24** | DocTick-Test (ayri repo) cift-tikla-calisir sekilde yeniden yapildi: pre-build wwwroot -> build asamasi yok; .NET-only launcher; her OS klasorunde TEK baslatici; baslatWINDOWS.bat/_kurulum.bat/BASLA.md/CONTEXT.md/.slnx silindi. Auth:AutoApprove=true (herkes aninda onayli). Ana DocTick etkilenmedi (test ayarlari yalnizca DocTick-Test'te). [Source: release]

- **2026-07-24** | DocTick-Test push tamam (2026-07-24): https://github.com/tahakeskin53/DocTick-Test (private, main). Ana proje revert edildi ve dogrulandi; test ayarlari yalnizca bu repoda. [Source: test-repo-push]

- **2026-07-24** | DocTick-Test test deposu kuruldu (2026-07-24): juri icin mac/windows ayrilmis, test=otomatik onay+self-bootstrap. Ana proje revert edildi ve 4-ajanli workflow ile dogrulandi (test ayarlari ana projede YOK). Yerel commit 9227e83; push gh auth bekliyor. [Source: test-repo-setup]

- **2026-07-24** | Onboarding/juri teslimi tamam (2026-07-24): Windows launcher'lar artik _kurulum.bat ile yoneticisiz Node+.NET kuruyor; Auth:AutoApprove=true (her giris aktif Hasta); BASLA.md eklendi, README '2 anahtar' bolumu 'anahtar gerekmez' olarak duzeltildi; temiz ZIP icin git archive allowlist BASLA.md'de. Backend derlemesi TAMAM (kod hatasi yok; MSB3027 yalnizca calisan DocTick.Api.exe dosya kilidinden). [Source: onboarding-setup]

- **2026-07-23** | Stitch mockup asamasi: birkac ekran uretildi ve kabuk sapmasi cozuldu. Kullanici deliverable/fonksiyonellik sorusuna geldi. Onemli: gercek DocTick zaten calisan uygulama (React+.NET); Stitch mockup'lari 'tasarim asamasi' artefakti, fonksiyonel olmasi gerekmez. Fonksiyonellik ya tiklanabilir Figma prototip (kodsuz) ya da mevcut gercek app. [Source: mockup]

- **2026-07-23** | E-POSTA COZUMU (2026-07-23): Resend__ApiKey User env var olarak set edildi (appsettings.json yer tutucu kaldi). Anahtar gecerli (Resend probe HTTP 422). Backend restart sonrasi iletim formu + tum e-posta ozellikleri calisir. Domain dogrulanmadigi icin posta tahakeskin06@hotmail.com'a yonlenir (RedirectTo). Teslimden once anahtar rotate edilmeli (git gecmisinde vardi). [Source: debug-session]

- **2026-07-23** | Google Stitch mockup brief hazirlandi (20 ekran, hasta+admin). Yaklasim: guclu global stil blogu + birebir Turkce icerikli per-ekran promptlar; gerekirse vitrin ekranlar icin screenshot referansi eklenir. Auth engeli: ic ekranlar /me'ye bagli, Google OAuth bekleyen config -> canli screenshot zor. [Source: mockup]

- **2026-07-23** | BILINEN DURUM (2026-07-23): E-posta alt sistemi calismiyor — Resend:ApiKey appsettings.json'da yer tutucu 're_BURAYA_KENDI_RESEND_ANAHTARINIZ', runtime env var Resend__ApiKey set degil. Iletisim formu + randevu onay/iptal/hatirlatma + hesap onay postalari 502 doner. Cozum: Resend'den yeni anahtar + [Environment]::SetEnvironmentVariable('Resend__ApiKey','re_...','User') + backend restart. Kod dogru, sadece config eksik. [Source: debug-session]

- **2026-07-23** | PWA TAMAM ve kullanici tarafindan dogrulandi: DocTick_App.bat ile kurulabilir PWA calisiyor (build+wwwroot+5080 tek origin), offline Randevularim, autoUpdate, Google auth 5080 ile calisir. Kalan opsiyonel: HTTPS deploy + magaza paketleme (spec 9). [Source: dogrulama]

- **2026-07-23** | PWA implementasyonu TAMAMLANDI (frontend/ icine uygulandi, ayri DocTick-App klasoru YAPILMADI). build -> dist -> backend/wwwroot kopyasi -> dotnet publish ile tek origin. Kalan: kullici elle kurulum/offline test (browser) + public HTTPS deploy sonrasi magaza paketleme. [Source: implementasyon]

- **2026-07-23** | PWA plani hazir (6 gorev): ikonlar, check_pwa.mjs, vite-plugin-pwa config, offline banner/buton kilidi, backend statik servis + SPA fallback (Program.cs'te henuz yok!), e2e dogrulama. Uygulama beklemede. [Source: planning]

- **2026-07-23** | Giris hatasinin kok nedeni: baslatWINDOWS.bat tarayiciyi backend hazir olmadan aciyordu (Vite --open) -> frontend acik/backend yok -> Giris basarisiz. Duzeltildi: scriptler artik backend saglik kontrolunu (GET localhost:5080/ 200) bekleyip ondan sonra tarayiciyi aciyor. Kullanici sadece baslatWINDOWS.bat calistirmali, elle backend baslatmaya gerek yok. [Source: startup-scripts-fix]

- **2026-07-23** | Giris hatalari artik backend/logs/auth-*.log JSONL dosyasina yaziliyor (login_success/token_invalid/config_error, sebep+ip+ua). Giris teskisinde ONCE bu dosyaya bak. Frontend Login.tsx artik gercek hatayi console.error ile basiyor (backend kapali gibi network hatalari icin). [Source: auth-audit-feature]

- **2026-07-23** | Cift randevu (ayni hasta+saat) bugi tespit ve cozum: koruma kodu hazir, lokal doctick.db silindi. Commitleme bekliyor. [Source: bugfix]

- **2026-07-23** | GitHub repo public yapildi (github.com/tahakeskin53/DockTick), secret taramasi temiz [Source: session]

- **2026-07-22** | Sinematik landing (/login) + Booking (/randevu-al) redesign tamamlandi; gsap 3.15.0 + lenis 1.3.25 dependency eklendi; ScrollVideo/SmoothScroll/AutoTour infra (components/scroll/) + lib/gsap.ts. Branch feat/landing-booking-redesign commit 3cb5d5e, main den dallandi (ff-merge bekliyor). npm run build yesil (tsc+vite, 164 modul). [Source: session]

- **2026-07-22** | Teknik teslim dokumantasyon katmani eklendi (Temmuz 2026): docs/ + kok CONTEXT.md + 7 ADR. README docs/ isaretcisi + olgusal duzeltmeler (admin email hotmail, 7 test, 420 haftalik slot). Resend anahtari yer tutucu. ERD/mimari Db.cs+Program.cs birebir dogrulandi. [Source: docs]

- **2026-07-21** | Hastane online randevu sistemi uygulamasi TAMAMLANDI ve GitHub'a pushlandi. Stack: backend ASP.NET Core 10 minimal API + EF Core/SQLite; frontend Vite 8 + React 19 + TS. Google OAuth (cookie), Resend e-posta (raw HttpClient), 5dk hatirlatma BackgroundService. Tasarim sistemi ('DocTick Design System/') frontend'e tasindi. 6 xunit testi geciyor. Calisma: backend localhost:5080, frontend 5173 (Vite /api proxy). BEKLEYEN: Google Client ID (frontend/.env.local + backend/appsettings.json aynisi) ve Resend API key (backend/appsettings.json) eklenmeli — gercek login/e-posta icin. [Source: agent]

- **2026-07-21** | mattpocock/skills katmani eklendi: skills.sh --copy ile 41 skill (.claude/skills/ + .agents/skills/), local-files issue tracker (.scratch/), docs/agents/ konfigurasyonu yazildi, CLAUDE.md'ye Agent skills bloğu eklendi [Source: setup]

- **2026-07-21** | Tech: project-local Python venv (.venv); git repo on main. [Source: seed]

- **2026-07-21** | Internship (staj) project. Memory layer managed by memkraft. [Source: seed]

- **2026-07-21** | memkraft memory layer added [Source: setup]

- **2026-07-21** | Live note created [Source: setup]
