@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DocTick App
echo ============================================
echo   DocTick App hazirlaniyor...
echo   (Yonetici yetkisi GEREKMEZ)
echo ============================================
echo.

rem --- .NET 10 SDK: yoksa kullanici klasorune kur (%USERPROFILE%\.dotnet) ---
set "DOTNET_DIR=%USERPROFILE%\.dotnet"
set "PATH=%DOTNET_DIR%;%PATH%"
set "DOTNET_ROOT=%DOTNET_DIR%"
set "DNOK=0"
where dotnet >nul 2>&1
if errorlevel 1 goto :dotnet_check
dotnet --list-sdks 2>nul | findstr /B "10." >nul
if errorlevel 1 goto :dotnet_check
set "DNOK=1"
:dotnet_check
if "%DNOK%"=="1" goto :dotnet_ok
if exist "%DOTNET_DIR%\dotnet.exe" goto :dotnet_ok
echo [.NET 10 SDK] bulunamadi -^> %DOTNET_DIR% kuruluyor (yoneticisiz)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ProgressPreference='SilentlyContinue'; & ([scriptblock]::Create((iwr -UseBasicParsing 'https://dot.net/v1/dotnet-install.ps1'))) -InstallDir '%DOTNET_DIR%' -Channel 10.0"
if not exist "%DOTNET_DIR%\dotnet.exe" ( echo HATA: .NET 10 SDK kurulamadi. Internet baglantinizi kontrol edin. & pause & exit /b 1 )
goto :dotnet_done
:dotnet_ok
echo [.NET 10 SDK] hazir.
:dotnet_done
echo.

rem --- wwwroot kontrolu: onceden derlenmis PWA burada servis edilir ---
if not exist "backend\wwwroot\index.html" (
  echo HATA: backend\wwwroot\index.html bulunamadi.
  echo        Paket bozuk olabilir - lutfen ZIP'i yeniden indirin.
  pause
  exit /b 1
)

rem --- Backend (5080): zaten ayakta degilse baslat - SPA + API tek origin ---
call :isup 5080
if errorlevel 1 (
  echo Backend baslatiliyor (5080)... ilk derleme biraz surebilir.
  start "DocTick App (5080)" cmd /k "cd /d backend && dotnet run --urls http://localhost:5080"
) else (
  echo Backend zaten calisiyor (5080).
)

rem --- Backend gercekten yanit verene kadar bekle - tarayiciyi erken ACMA ---
echo Backend hazirlanmasi bekleniyor ^(ilk calistirmada paketler indirilip derlenir, birkac dakika surebilir^)...
set /a WCNT=0
:waitback
call :isup 5080
if not errorlevel 1 goto :backready
set /a WCNT+=1
if %WCNT% geq 120 (
  echo.
  echo --- Backend 5080'de yaklasik 6 dk icinde yanit vermedi. ---
  echo "DocTick App ^(5080^)" penceresini kontrol edin - orada hata yaziyor olabilir.
  echo ^(5080 portu baska bir uygulama tarafindan kullanimda olabilir.^)
  pause
  exit /b 1
)
ping -n 4 127.0.0.1 >nul
goto waitback
:backready
echo Backend hazir (5080).
echo.
echo Tarayici aciliyor: http://localhost:5080
start "" http://localhost:5080
echo.
echo DocTick App calisiyor.
echo Durdurmak icin "DocTick App (5080)" penceresini kapat ^(Ctrl+C^).
ping -n 5 127.0.0.1 >nul
exit /b 0

rem ============ yardimci: isup PORT -> 0=ayakta, 1=kapali ============
:isup
powershell -NoProfile -Command "try{ [void](Invoke-WebRequest ('http://localhost:%1/') -UseBasicParsing -TimeoutSec 2); exit 0 }catch{ if($_.Exception.Response){ exit 0 } else { exit 1 } }" >nul 2>&1
exit /b %errorlevel%
