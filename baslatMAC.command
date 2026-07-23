#!/bin/bash
# DocTick — macOS baslatici + otomatik kurulum (YONETICI YETKISI GEREKTIRMEZ)
#
# ============================ NASIL ACILIR ============================
#  Terminal'e HICBIR SEY yazmana gerek yok. Sadece fare ile:
#   1) Indirdigin ZIP'i cift tiklayip klasore cikar.
#   2) Bu dosyaya  (baslatMAC.command)  SAG TIKLA -> "Ac" (Open)
#      -> cikan guvenlik uyarisinda tekrar "Ac".
#      * Bu adim SADECE ILK SEFER gerekir (Apple imzasiz uygulama uyarisi).
#        Sonraki acilislarda dogrudan CIFT TIKLAMAK yeter.
#   * sudo / yonetici sifresi ISTEMEZ.
# =====================================================================
#
# Ne yapar: eksik olani (Node.js + .NET 10 SDK) ev dizinine yoneticisiz kurar,
# backend + frontend'i baslatir, backend HAZIR OLUNCA tarayiciyi acar.
# Kurulu olani atlar; ikinci calistirmada sadece sunuculari baslatir.

set -e
cd "$(dirname "$0")" || exit 1
ROOT="$(pwd)"

# Internetten inen dosyalara macOS "karantina" bayragi koyar; bu, ic dosyalarin
# tekrar tekrar guvenlik uyarisi vermesine yol acar. Proje klasorunden (bu dosya
# dahil) karantinayi kaldiriyoruz -> boylece BUNDAN SONRA duz CIFT TIKLA yeter.
xattr -dr com.apple.quarantine "$ROOT" 2>/dev/null || true

# --- Kurulum dizinleri (hepsi ev dizininde, sudo gerektirmez) ------------------
DOTNET_DIR="$HOME/.dotnet"
NODE_DIR="$HOME/.node"
export DOTNET_ROOT="$DOTNET_DIR"
export PATH="$NODE_DIR/bin:$DOTNET_DIR:$PATH"

# Islemci mimarisi (Apple Silicon = arm64, Intel = x64)
if [ "$(uname -m)" = "arm64" ]; then NARCH="arm64"; else NARCH="x64"; fi

echo "=============================================="
echo "  DocTick — kurulum kontrolu ve baslatma"
echo "  (yonetici yetkisi gerekmez)"
echo "=============================================="

# 1) Node.js --------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  # ponytail: Node LTS surumu sabit. Vite icin 18+ yeter; 22 LTS uzun sure gecerli.
  NODE_VER="v22.11.0"
  echo "[1/3] Node.js bulunamadi -> $NODE_VER ev dizinine kuruluyor (yoneticisiz)..."
  curl -fsSL "https://nodejs.org/dist/$NODE_VER/node-$NODE_VER-darwin-$NARCH.tar.gz" -o /tmp/node.tar.gz
  mkdir -p "$NODE_DIR"
  tar -xzf /tmp/node.tar.gz -C "$NODE_DIR" --strip-components 1
  rm -f /tmp/node.tar.gz
else
  echo "[1/3] Node.js    : kurulu ($(node --version)), atlaniyor."
fi

# 2) .NET 10 SDK -----------------------------------------------------------------
if ! (command -v dotnet >/dev/null 2>&1 && dotnet --list-sdks 2>/dev/null | grep -q '^10\.'); then
  echo "[2/3] .NET 10 SDK bulunamadi -> ~/.dotnet dizinine kuruluyor (yoneticisiz)..."
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel 10.0 --install-dir "$DOTNET_DIR"
  rm -f /tmp/dotnet-install.sh
else
  echo "[2/3] .NET 10 SDK: kurulu, atlaniyor."
fi

# 3) Frontend bagimliliklari (node_modules) --------------------------------------
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "[3/3] Frontend paketleri kuruluyor (npm install)..."
  (cd "$ROOT/frontend" && npm install)
else
  echo "[3/3] Frontend paketleri: kurulu, atlaniyor."
fi

echo
echo "Kurulum tamam. Sunucular baslatiliyor..."

# --- Sunuculari iki ayri Terminal penceresinde baslat --------------------------
# PATH'i acikca gecirdik ki yeni pencereler node/dotnet'i mutlaka bulsun.
ENV_EXPORT="export DOTNET_ROOT='$DOTNET_DIR'; export PATH='$NODE_DIR/bin:$DOTNET_DIR:\$PATH';"

# Backend (API + DB) — http://localhost:5080  (zaten ayaktaysa yeniden baslatma)
if curl -fsS http://localhost:5080/ >/dev/null 2>&1; then
  echo "Backend zaten calisiyor (5080), yeniden baslatilmadi."
else
  osascript -e "tell application \"Terminal\" to do script \"$ENV_EXPORT cd '$ROOT/backend' && dotnet run --urls http://localhost:5080\""
fi

# Frontend (Vite) — http://localhost:5173  (tarayiciyi BIZ acacagiz, backend hazir olunca)
if curl -fsS http://localhost:5173/ >/dev/null 2>&1; then
  echo "Frontend zaten calisiyor (5173)."
else
  osascript -e "tell application \"Terminal\" to do script \"$ENV_EXPORT cd '$ROOT/frontend' && npm run dev\""
fi

# Backend GERCEKTEN yanit verene kadar bekle, tarayiciyi ondan sonra ac.
# Boylece "arka uc yok -> Giris basarisiz" durumu olusamaz (ilk derleme uzun surebilir).
printf "Backend hazir olmasi bekleniyor"
until curl -fsS http://localhost:5080/ >/dev/null 2>&1; do printf "."; sleep 2; done
echo " -> hazir (5080)."

# Frontend hazir olana kadar bekle
until curl -fsS http://localhost:5173/ >/dev/null 2>&1; do sleep 1; done

echo "Tarayici aciliyor: http://localhost:5173"
open "http://localhost:5173"

echo
echo "Backend (5080) + Frontend (5173) calisiyor."
echo "Durdurmak icin: her iki Terminal penceresinde Ctrl+C ya da pencereyi kapat."
