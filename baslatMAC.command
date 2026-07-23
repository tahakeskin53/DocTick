#!/bin/bash
# DocTick — macOS baslatici (cift tiklayarak calistir)
# Not: Ilk kez calismazsa Terminal'de bir kez sunu calistir:
#   chmod +x baslatMAC.command

cd "$(dirname "$0")" || exit 1
ROOT="$(pwd)"
echo "DocTick baslatiliyor..."

# Backend (API + DB) — http://localhost:5080  →  yeni Terminal penceresi
osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT/backend' && dotnet run --urls http://localhost:5080\""

# Frontend (Vite) — http://localhost:5173 , tarayiciyi otomatik acar  →  yeni Terminal penceresi
osascript -e "tell application \"Terminal\" to do script \"cd '$ROOT/frontend' && npm run dev -- --open\""

echo
echo "Iki Terminal penceresi acildi: Backend + Frontend."
echo "Tarayici otomatik acilir (5173). Acilmazsa admin.url / kullanici.url tiklayin."
echo "Durdurmak icin: her iki pencerede Ctrl+C ya da pencereyi kapat."
