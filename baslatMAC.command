#!/bin/bash
# DocTick — macOS baslatici + otomatik kurulum (YONETICI YETKISI GEREKTIRMEZ)
#
# Ilk calistirmada eksik olan her seyi ev dizinine kurar:  Node.js, .NET 10 SDK.
# Homebrew KULLANMAZ, sudo/administrator GEREKTIRMEZ. Standart hesapta calisir.
# Sonraki her calistirmada kurulu olanlari ATLAR, sadece sunuculari baslatir
# ve siteyi tarayicida acar.
#
# Calistirma:  Terminal'i ac ->  bash <bu dosyayi surukle-birak> -> Enter
#              (sudo YAZMA. Sadece bash.)

set -e
cd "$(dirname "$0")" || exit 1
ROOT="$(pwd)"

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

# Backend (API + DB) — http://localhost:5080
osascript -e "tell application \"Terminal\" to do script \"$ENV_EXPORT cd '$ROOT/backend' && dotnet run --urls http://localhost:5080\""

# Frontend (Vite) — http://localhost:5173 , tarayiciyi otomatik acar
osascript -e "tell application \"Terminal\" to do script \"$ENV_EXPORT cd '$ROOT/frontend' && npm run dev -- --open\""

echo
echo "Iki Terminal penceresi acildi: Backend (5080) + Frontend (5173)."
echo "Tarayici otomatik http://localhost:5173 acar. Acilmazsa elle git."
echo "Durdurmak icin: her iki pencerede Ctrl+C ya da pencereyi kapat."
