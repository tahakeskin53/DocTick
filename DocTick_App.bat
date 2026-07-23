@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo DocTick App hazirlaniyor...
echo.

rem --- 1) Frontend'i PWA ile derle (dist/: sw.js + manifest.webmanifest + precache) ---
echo [1/3] Frontend derleniyor - PWA build...
pushd frontend
call npm run build
set BErr=%errorlevel%
popd
if %BErr% neq 0 (
  echo HATA: Frontend derlemesi basarisiz ^(kod %BErr%^).
  echo        Node/npm kurulu mu? Ilk kez calistiriyorsaniz once "frontend" klasorunde "npm install" yapin.
  pause
  exit /b %BErr%
)

rem --- 2) Derlenen PWA'yi backend'e kopyala - SPA + API ayni origin: 5080 ---
echo [2/3] PWA backend\wwwroot altina kopyalaniyor...
if not exist "backend\wwwroot" mkdir "backend\wwwroot"
robocopy "frontend\dist" "backend\wwwroot" /MIR /NFL /NDL /NJH /NJS >nul
rem robocopy cikis kodu 0-7 = basarili, 8 ve ustu = hata
if errorlevel 8 (
  echo HATA: wwwroot kopyalamasi basarisiz.
  pause
  exit /b 1
)

rem --- 3) Backend'i baslat - zaten ayakta degilse; tek origin'den PWA servis edilir ---
call :isup 5080
if errorlevel 1 (
  echo [3/3] Backend baslatiliyor ^(5080^)... ilk calistirmada derleme biraz surebilir.
  start "DocTick App (5080)" cmd /k "cd /d backend && dotnet run --urls http://localhost:5080"
) else (
  echo [3/3] Backend zaten calisiyor ^(5080^).
  echo        NOT: Yeni derlemeyi gormek icin DocTick App penceresini kapatip bu BAT'i yeniden calistirin.
)

rem --- Backend gercekten yanit verene kadar bekle - tarayiciyi erken ACMA ---
echo Backend hazirlanmasi bekleniyor...
:waitback
call :isup 5080
if errorlevel 1 (
  ping -n 3 127.0.0.1 >nul
  goto waitback
)
echo Backend hazir ^(5080^).

echo.
echo Tarayici aciliyor: http://localhost:5080
start "" http://localhost:5080
echo.
echo DocTick App calisiyor. Telefona/Bilgisayara KURMAK icin:
echo    Edge/Chrome adres cubugundaki "Uygulamayi yukle" simgesini ya da
echo    menu ^> "Ana ekrana ekle" kullanin. Kurduktan sonra internet olsa da
echo    olmasa da uygulama gibi acilir.
echo.
echo Durdurmak icin DocTick App penceresini kapatin - Ctrl+C.
ping -n 6 127.0.0.1 >nul
exit /b 0

rem ============ yardimci: isup PORT - errorlevel 0 = ayakta, 1 = kapali ============
:isup
powershell -NoProfile -Command "try{ [void](Invoke-WebRequest ('http://localhost:%1/') -UseBasicParsing -TimeoutSec 2); exit 0 }catch{ if($_.Exception.Response){ exit 0 } else { exit 1 } }" >nul 2>&1
exit /b %errorlevel%
