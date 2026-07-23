#!/bin/bash
# DocTick — macOS baslatici + otomatik kurulum (cift tiklayarak calistir)
#
# Ilk calistirmada eksik olan her seyi kurar:  Homebrew, .NET 10 SDK, Node.js.
# Sonraki her calistirmada kurulu olanlari ATLAR, sadece backend + frontend
# sunucularini baslatir ve siteyi tarayicida acar.
#
# Ilk kez calismazsa (izin hatasi) Terminal'de bir kez sunu calistir:
#   chmod +x baslatMAC.command

set -e
cd "$(dirname "$0")" || exit 1
ROOT="$(pwd)"

# --- .NET yerel kurulum dizini (sudo gerektirmez) ------------------------------
DOTNET_DIR="$HOME/.dotnet"
export DOTNET_ROOT="$DOTNET_DIR"
export PATH="$DOTNET_DIR:$PATH"

# --- Homebrew konumu (Apple Silicon vs Intel) ---------------------------------
if [ -d "/opt/homebrew/bin" ]; then
  BREW_PREFIX="/opt/homebrew"
else
  BREW_PREFIX="/usr/local"
fi
export PATH="$BREW_PREFIX/bin:$PATH"

echo "=============================================="
echo "  DocTick — kurulum kontrolu ve baslatma"
echo "=============================================="

# 1) Homebrew --------------------------------------------------------------------
if ! command -v brew >/dev/null 2>&1; then
  echo "[1/4] Homebrew bulunamadi -> kuruluyor (bir kez Mac sifreni isteyebilir)..."
  NONINTERACTIVE=1 /bin/bash -c \
    "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  eval "$($BREW_PREFIX/bin/brew shellenv)"
else
  echo "[1/4] Homebrew   : kurulu, atlaniyor."
fi

# 2) Node.js (npm) ---------------------------------------------------------------
if ! command -v node >/dev/null 2>&1; then
  echo "[2/4] Node.js bulunamadi -> brew install node..."
  brew install node
else
  echo "[2/4] Node.js    : kurulu ($(node --version)), atlaniyor."
fi

# 3) .NET 10 SDK -----------------------------------------------------------------
if ! (command -v dotnet >/dev/null 2>&1 && dotnet --list-sdks 2>/dev/null | grep -q '^10\.'); then
  echo "[3/4] .NET 10 SDK bulunamadi -> ~/.dotnet dizinine kuruluyor..."
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel 10.0 --install-dir "$DOTNET_DIR"
  rm -f /tmp/dotnet-install.sh
else
  echo "[3/4] .NET 10 SDK: kurulu, atlaniyor."
fi

# 4) Frontend bagimliliklari (node_modules) --------------------------------------
if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "[4/4] Frontend paketleri kuruluyor (npm install)..."
  (cd "$ROOT/frontend" && npm install)
else
  echo "[4/4] Frontend paketleri: kurulu, atlaniyor."
fi

echo
echo "Kurulum tamam. Sunucular baslatiliyor..."

# --- Sunuculari iki ayri Terminal penceresinde baslat --------------------------
# PATH'i acikca gecirdik ki yeni pencereler dotnet/npm'i mutlaka bulsun.
ENV_EXPORT="export DOTNET_ROOT='$DOTNET_DIR'; export PATH='$DOTNET_DIR:$BREW_PREFIX/bin:\$PATH';"

# Backend (API + DB) — http://localhost:5080
osascript -e "tell application \"Terminal\" to do script \"$ENV_EXPORT cd '$ROOT/backend' && dotnet run --urls http://localhost:5080\""

# Frontend (Vite) — http://localhost:5173 , tarayiciyi otomatik acar
osascript -e "tell application \"Terminal\" to do script \"$ENV_EXPORT cd '$ROOT/frontend' && npm run dev -- --open\""

echo
echo "Iki Terminal penceresi acildi: Backend (5080) + Frontend (5173)."
echo "Tarayici otomatik http://localhost:5173 acar. Acilmazsa elle git."
echo "Durdurmak icin: her iki pencerede Ctrl+C ya da pencereyi kapat."
