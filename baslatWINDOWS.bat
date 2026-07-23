@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo DocTick baslatiliyor...
echo.

rem Backend (API + DB) — http://localhost:5080
start "DocTick Backend (5080)" cmd /k "cd /d backend && dotnet run --urls http://localhost:5080"

rem Frontend (Vite) — http://localhost:5173 , tarayiciyi otomatik acar
start "DocTick Frontend (5173)" cmd /k "cd /d frontend && npm run dev -- --open"

echo.
echo Iki pencere acildi: Backend + Frontend.
echo Tarayici otomatik acilir (5173). Acilmazsa admin.url / kullanici.url tiklayin.
echo.
echo Durdurmak icin: her iki pencereyi carpidan kapat (Ctrl+C de olur).
timeout /t 4 >nul
