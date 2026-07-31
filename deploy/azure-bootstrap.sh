#!/usr/bin/env bash
# DocTick → Azure App Service tek seferlik kurulum (Faz 1 + Faz 3).
# Git Bash'te çalıştır:  bash deploy/azure-bootstrap.sh
#
# Secret'lar ORTAM DEĞİŞKENİ olarak verilir — repoya HİÇ girmeden.
#   export RESEND_API_KEY="re_..."    (Resend → API Keys)
#   export VITE var gerekmez (.env commit'li); admin email varsayılanı appsettings'ten.
#
# DNS/SSL (Faz 2) ve Google/Resend konsolları (Faz 5) elle — script sonunda değerleri basılır.
set -euo pipefail

# --- Sırlar (zorunlu) ---
: "${RESEND_API_KEY:?RESEND_API_KEY ortam değişkenini ayarla (Resend API anahtarı).}"

# --- Yapılandırma (override edilebilir) ---
RG="${RG:-doctick-rg}"
PLAN="${PLAN:-doctick-plan}"
APP="${APP:-doctick}"                 # → <APP>.azurewebsites.net (global benzersiz olmalı)
LOC="${LOC:-westeurope}"
RUNTIME="${RUNTIME:-DOTNETCORE|10.0}"   # CLI 2.88+ pipe formatı (colon değil); list-runtimes çıktısıyla birebir olmalı
ADMIN_EMAIL="${ADMIN_EMAIL:-tahakeskin06@hotmail.com}"
FROM_EMAIL="${FROM_EMAIL:-randevu@doctick.me}"   # doctick.me Resend'de doğrulandı (DKIM+SPF, eu-west-1)

# --- Önkoşullar ---
command -v az >/dev/null 2>&1 || { echo "Azure CLI yok. kur: https://aka.ms/installazurecliwindows"; exit 1; }
az account show >/dev/null 2>&1 || { echo "Giriş yapılmamış. önce:  az login"; exit 1; }
echo "✔ Azure: $(az account show --query user.name -o tsv 2>/dev/null || echo '?') · abonelik=$(az account show --query id -o tsv)"

# .NET 10 runtime stack var mı? Yoksa self-contained publish gerekir (workflow'daki nota bak).
if ! az webapp list-runtimes --os linux | grep -qF "$RUNTIME"; then
  echo "✘ $RUNTIME App Service'te yok. İki seçenek:" >&2
  echo "   (a) Azure portal'da güncel runtime listesini kontrol et, RUNTIME değişkenini ona ayarla." >&2
  echo "   (b) .github/workflows/azure-deploy.yml publish satırına  -r linux-x64 --self-contained true  ekle." >&2
  exit 1
fi
echo "✔ Runtime $RUNTIME mevcut."

# ============ FAZ 1 — Kaynaklar ============
echo ">>> Faz 1: kaynak grubu + plan + webapp ($APP)"
az group create -n "$RG" -l "$LOC" -o table
az appservice plan create -g "$RG" -n "$PLAN" --is-linux --sku B1 -o table
az webapp create -g "$RG" -p "$PLAN" -n "$APP" --runtime "$RUNTIME" -o table
az webapp config set -g "$RG" -n "$APP" --always-on true --number-of-workers 1 -o table

# ============ FAZ 3 — Yapılandırma ve sırlar ============
# E-posta alıcısı ortama göre değişir (kural: EmailService.SendAsync → RedirectTo):
#   PROD (burası)  Resend__RedirectTo=""  → e-posta GERÇEK ÜYEYE gider.
#   YEREL          backend/appsettings.Development.json içindeki RedirectTo dolu
#                  → tüm e-postalar o tek adrese düşer, gerçek hastalara gitmez.
# Yerelde bu emniyet kemerini kaldırma: doktor silme gibi akışlar tek işlemde
# birden çok hastaya iptal bildirimi gönderir.
echo ">>> Faz 3: app settings (TZ, DB yolu, Resend, admin)"
az webapp config appsettings set -g "$RG" -n "$APP" --settings \
  TZ="Europe/Istanbul" \
  ConnectionStrings__Default="Data Source=/home/doctick.db" \
  AUTH_AUDIT_DIR="/home/LogFiles/auth" \
  ASPNETCORE_ENVIRONMENT="Production" \
  Resend__ApiKey="$RESEND_API_KEY" \
  Resend__FromEmail="$FROM_EMAIL" \
  Resend__FromName="DocTick" \
  Resend__RedirectTo="" \
  Admin__Email="$ADMIN_EMAIL" \
  AllowedHosts="$APP.azurewebsites.net" \
  -o table

# ============ DNS için gerekli değerler (Faz 2) ============
INBOUND_IP=$(az webapp show -g "$RG" -n "$APP" --query inboundIpAddress -o tsv)
VERIFY_ID=$(az webapp show -g "$RG" -n "$APP" --query customDomainVerificationId -o tsv)

# ============ GitHub Actions publish profile (Faz 4 secret'ı) ============
PROFILE_FILE="doctick-publish-profile.xml"
az webapp deployment list-publishing-profiles -g "$RG" -n "$APP" --xml > "$PROFILE_FILE"

# ============ Sonuç + elle yapılacaklar ============
cat <<EOF

════════════════════════════════════════════════════════════════
 KURULUM TAMAM  ·  https://$APP.azurewebsites.net
════════════════════════════════════════════════════════════════

▶ FAZ 4 — GitHub Actions (CI/CD):
  1. Repo → Settings → Secrets and variables → Actions → New secret:
       Name:  AZURE_WEBAPP_PUBLISH_PROFILE
       Value: $PROFILE_FILE dosyasının TAM içeriği (kopyala → yapıştır)
  2. $PROFILE_FILE dosyasını SİL (deploy kimlik bilgisi içerir, repoya girmesin):
       rm $PROFILE_FILE
  3. main'e push → Actions otomatik deploy eder. (önce 'az login' sonrası workflow_dispatch ile de tetiklenebilir)

▶ FAZ 2 — DNS (doctick.me) — domain kayıt firmanın panelinde:
  A     @           →  $INBOUND_IP
  TXT   asuid       →  $VERIFY_ID
  CNAME www         →  $APP.azurewebsites.net
  TXT   asuid.www   →  $VERIFY_ID
  DNS yayılınca (nslookup doctick.me):
     az webapp config hostname add -g $RG -n $APP --hostname doctick.me
     az webapp config hostname add -g $RG -n $APP --hostname www.doctick.me
     az webapp config ssl create -g $RG -n $APP --hostname doctick.me      # ücretsiz, otomatik yenilenir
     az webapp config ssl bind   -g $RG -n $APP --hostname doctick.me --ssl-type SNI
     az webapp update --https-only true -g $RG -n $APP

▶ FAZ 5 — Dış servisler (konsol):
  Google Cloud Console → Credentials → OAuth Client → Authorized JS origins:
     https://$APP.azurewebsites.net   (önce bununla test et)
     https://doctick.me               (DNS yayıldıktan sonra ekle)
     http://localhost:5173  KALSIN (geliştirme)
  Resend → Domains → doctick.me  ✔ DOĞRULANDI (DKIM + SPF canlı, bölge eu-west-1).
     Yeni kurulumda tekrar gerekmez; domain silinip yeniden eklenirse DKIM 'p=' değeri
     değişir, DNS kayıtları da yenilenmeli.
     E-posta alıcısı: prod → gerçek üye · yerel → appsettings.Development.json'daki
     RedirectTo adresi. (Ayrıntı: Faz 3 blokundaki not.)

▶ İlk deploy sonrası Doğrulama listesi:  docs/12-azure-deployment.md (son bölüm)

Eldeki değerleri not et — DNS ve GitHub secret için lazım:
  inbound IP         : $INBOUND_IP
  verification ID    : $VERIFY_ID
  publish profile    : ./$PROFILE_FILE  (GitHub secret'a koy, sonra sil)
EOF
