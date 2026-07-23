@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo DocTick baslatiliyor...
echo.

rem --- Backend (API + DB, 5080): zaten ayakta degilse ayri pencerede baslat ---
call :isup 5080
if errorlevel 1 (
  echo Backend baslatiliyor... ilk calistirmada derleme biraz surebilir.
  start "DocTick Backend (5080)" cmd /k "cd /d backend && dotnet run --urls http://localhost:5080"
) else (
  echo Backend zaten calisiyor ^(5080^), yeniden baslatilmadi.
)

rem --- Frontend (Vite, 5173): tarayiciyi BIZ acacagiz (backend hazir olunca) ---
call :isup 5173
if errorlevel 1 (
  start "DocTick Frontend (5173)" cmd /k "cd /d frontend && npm run dev"
) else (
  echo Frontend zaten calisiyor ^(5173^).
)

rem --- Backend gercekten yanit verene kadar bekle: tarayiciyi erken ACMA ---
rem     Boylece "arka uc yok -> Giris basarisiz" durumu olusamaz.
echo Backend hazir olmasi bekleniyor...
:waitback
call :isup 5080
if errorlevel 1 (
  ping -n 3 127.0.0.1 >nul
  goto waitback
)
echo Backend hazir ^(5080^).

rem --- Frontend hazir olana kadar bekle ---
:waitfront
call :isup 5173
if errorlevel 1 (
  ping -n 2 127.0.0.1 >nul
  goto waitfront
)
echo Frontend hazir ^(5173^).

echo.
echo Tarayici aciliyor: http://localhost:5173
start "" http://localhost:5173
echo.
echo Backend + Frontend calisiyor. Durdurmak icin iki pencereyi de kapatin ^(Ctrl+C^).
ping -n 4 127.0.0.1 >nul
exit /b 0

rem ============ yardimci: :isup PORT -> errorlevel 0 = ayakta, 1 = kapali ============
:isup
powershell -NoProfile -Command "try{ [void](Invoke-WebRequest ('http://localhost:%1/') -UseBasicParsing -TimeoutSec 2); exit 0 }catch{ if($_.Exception.Response){ exit 0 } else { exit 1 } }" >nul 2>&1
exit /b %errorlevel%
