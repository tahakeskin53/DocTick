#!/usr/bin/env sh
# API uçlarının GERÇEKTEN kayıtlı olduğunu doğrular.
#
# Neden var: /api/* yolları bir süre SPA fallback'ine düşüyordu. Eksik bir uç istemciye
# 200 + text/html olarak dönüyor, client.ts bunu sessizce undefined'a çeviriyordu —
# ne 404 ne konsol hatası, sadece boş liste. Bu betik o sınıfı yakalar.
#
# Beklenen: kimliksiz istekte korumalı uç 401 döner (route VAR, yetki yok).
#           404 = uç kaydedilmemiş. 200 + text/html = fallback yine yutuyor.
#
# Kullanım:  sh scripts/smoke-api.sh [taban-url]     (varsayılan http://localhost:5080)

BASE="${1:-http://localhost:5080}"
fail=0

# check <beklenen-kod> <yol> [metot]
# Not: yanlış metotla istenen bir uç 405 değil 404 döner — /api/{*rest} yakalayıcısı
# tüm metotları kapsar. O yüzden POST uçları POST ile sınanmalı.
check() {
  want="$1"; path="$2"; method="${3:-GET}"
  out=$(curl -s -o /dev/null -w "%{http_code} %{content_type}" -X "$method" "$BASE$path")
  code=${out%% *}; ctype=${out#* }
  case "$ctype" in
    text/html*) echo "FAIL  $path -> $code $ctype  (SPA fallback yutuyor)"; fail=1; return;;
  esac
  if [ "$code" = "$want" ]; then
    echo "ok    $path -> $code"
  else
    echo "FAIL  $path -> $code (beklenen $want)"
    fail=1
  fi
}

echo "== $BASE =="

# Olmayan uç 404 olmalı; 200/text/html gelirse fallback koruması gitmiş demektir.
check 404 /api/kesinlikle-olmayan-bir-uc

# Korumalı uçlar: kimliksiz 401. 404 gelirse o uç hiç kaydedilmemiştir.
check 401 /api/doctor/appointments
check 401 /api/doctor/appointments/1/cancel POST
check 401 /api/doctor/patients
check 401 /api/doctor/patients/1/results
check 401 /api/results
check 401 /api/results/lab/1/file
check 401 /api/results/imaging/1/file
check 401 /api/appointments
check 401 /api/admin/users

[ "$fail" = 0 ] && echo "TUMU GECTI" || echo "BASARISIZ"
exit $fail
