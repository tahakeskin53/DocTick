#!/bin/bash
# DocTick — macOS baslatici + .NET kurulumu (YONETICI YETKISI GEREKTIRMEZ)
#
# ============================ NASIL ACILIR ============================
#  Terminal'e HICBIR SEY yazmana gerek yok. Sadece fare ile:
#   1) Indirdigin ZIP'i cift tiklayip klasore cikar.
#   2) Bu dosyaya (baslatMAC.command) SAG TIKLA -> "Ac" (Open)
#      -> cikan guvenlik uyarisinda tekrar "Ac".
#      * Bu adim SADECE ILK SEFER gerekir (Apple imzasiz uygulama uyarisi).
#        Sonraki acilislarda dogrudan CIFT TIKLAMAK yeter.
#   * sudo / yonetici sifresi ISTEMEZ.
# =====================================================================
#
# Ne yapar: .NET 10 SDK yoksa ev dizinine yoneticisiz kurar, sonra backend'i
# baslatir. Frontend onceden derlenmistir (backend/wwwroot) -> Node/npm GEREKMEZ.
# Backend hazir olunca tarayiciyi acar (http://localhost:5080).

set -e
cd "$(dirname "$0")" || exit 1
ROOT="$(pwd)"

# Internetten inen dosyalara macOS "karantina" bayragi koyar; bu, ic dosyalarin
# tekrar tekrar guvenlik uyarisi vermesine yol acar. Proje klasorunden kaldiriyoruz
# -> boylece BUNDAN SONRA duz CIFT TIKLA yeter.
xattr -dr com.apple.quarantine "$ROOT" 2>/dev/null || true

# --- Kurulum dizini (ev dizininde, sudo gerektirmez) --------------------------
DOTNET_DIR="$HOME/.dotnet"
export DOTNET_ROOT="$DOTNET_DIR"
export PATH="$DOTNET_DIR:$PATH"

echo "=============================================="
echo "  DocTick — baslatiliyor (yonetici yetkisi yok)"
echo "=============================================="

# 1) .NET 10 SDK -----------------------------------------------------------------
if ! (command -v dotnet >/dev/null 2>&1 && dotnet --list-sdks 2>/dev/null | grep -q '^10\.'); then
  if [ ! -x "$DOTNET_DIR/dotnet" ]; then
    echo "[1/2] .NET 10 SDK bulunamadi -> ~/.dotnet kuruluyor (yoneticisiz)..."
    curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
    bash /tmp/dotnet-install.sh --channel 10.0 --install-dir "$DOTNET_DIR"
    rm -f /tmp/dotnet-install.sh
  else
    echo "[1/2] .NET 10 SDK: kurulu (~/.dotnet)."
  fi
else
  echo "[1/2] .NET 10 SDK: kurulu, atlaniyor."
fi

# 2) wwwroot kontrolu ------------------------------------------------------------
if [ ! -f "$ROOT/backend/wwwroot/index.html" ]; then
  echo "HATA: backend/wwwroot/index.html bulunamadi. Paket bozuk olabilir - yeniden indirin."
  exit 1
fi

echo "Backend baslatiliyor (5080)... ilk derleme biraz surebilir."

# Backend'i ayri Terminal penceresinde baslat (PATH'i acikca gecir ki dotnet'i bulsun).
ENV_EXPORT="export DOTNET_ROOT='$DOTNET_DIR'; export PATH='$DOTNET_DIR:\$PATH';"

# Backend (API + DB + onceden derlenmis PWA) — http://localhost:5080
if curl -fsS http://localhost:5080/ >/dev/null 2>&1; then
  echo "Backend zaten calisiyor (5080), yeniden baslatilmadi."
else
  osascript -e "tell application \"Terminal\" to do script \"$ENV_EXPORT cd '$ROOT/backend' && dotnet run --urls http://localhost:5080\""
fi

# Backend GERCEKTEN yanit verene kadar bekle (sinirli), tarayiciyi ondan sonra ac.
printf "Backend hazir olmasi bekleniyor (ilk calistirmada paketler indirilir, birkac dk)..."
WCNT=0
until curl -fsS http://localhost:5080/ >/dev/null 2>&1; do
  printf "."
  sleep 2
  WCNT=$((WCNT+1))
  if [ $WCNT -ge 180 ]; then
    echo ""
    echo "HATA: Backend ~6 dk icinde yanit vermedi. Acilan Terminal penceresini kontrol edin"
    echo "(5080 portu baska uygulama tarafindan kullanimda olabilir)."
    exit 1
  fi
done
echo " -> hazir (5080)."

echo "Tarayici aciliyor: http://localhost:5080"
open "http://localhost:5080"

echo
echo "DocTick App calisiyor (5080)."
echo "Durdurmak icin: acilan Terminal penceresini kapat (Ctrl+C)."
