# DocTick denetim kaydi okuyucu - prod'daki JSONL log'u tablo halinde gosterir.
#
# Kullanim:
#   .\scripts\logs.ps1                        # bugun, son 30 islem
#   .\scripts\logs.ps1 -Son 100               # son 100
#   .\scripts\logs.ps1 -Tarih 2026-07-30      # baska bir gun
#   .\scripts\logs.ps1 -Filtre appointments   # sadece randevu islemleri
#   .\scripts\logs.ps1 -Filtre admin          # sadece admin islemleri
#   .\scripts\logs.ps1 -Kim ahmet@ornek.com   # tek kullanicinin yaptiklari
#   .\scripts\logs.ps1 -Ip 151.135            # tek IP / IP onekiyle filtrele
#   .\scripts\logs.ps1 -SadeceHatalar         # 4xx/5xx (reddedilen/basarisiz denemeler)
#   .\scripts\logs.ps1 -Ham                   # islenmemis JSON
#
# Gereksinim: az login yapilmis olmali ("az account show" ile teyit et).
#
# NOT: Bu dosya bilerek saf ASCII. PowerShell 5.1, BOM'suz .ps1 dosyalarini
# ANSI (cp1254) okur; Turkce karakter veya uzun tire koyarsan parser kirilir.

param(
    [string]$Tarih = (Get-Date -Format 'yyyy-MM-dd'),
    [string]$Filtre,
    [string]$Kim,
    [string]$Ip,
    [int]$Son = 30,
    [switch]$SadeceHatalar,
    [switch]$Ham
)

$ErrorActionPreference = 'Stop'

$token = az account get-access-token --query accessToken -o tsv
if (-not $token) { throw "az token alinamadi. Once 'az login' calistir." }

$url = "https://doctick.scm.azurewebsites.net/api/vfs/LogFiles/auth/auth-$Tarih.log"
try {
    $resp = Invoke-WebRequest -UseBasicParsing -Headers @{ Authorization = "Bearer $token" } $url
}
catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "$Tarih icin log yok (o gun hic islem yapilmamis olabilir)." -ForegroundColor Yellow
        return
    }
    throw
}

# Satirlar JSONL: her satir bagimsiz bir JSON nesnesi.
$kayitlar = $resp.Content -split "`n" | Where-Object { $_.Trim() } | ForEach-Object { $_ | ConvertFrom-Json }

if ($Filtre)        { $kayitlar = $kayitlar | Where-Object { $_.path -like "*$Filtre*" } }
if ($Kim)           { $kayitlar = $kayitlar | Where-Object { $_.email -like "*$Kim*" -or $_.detail -like "*$Kim*" } }
if ($Ip)            { $kayitlar = $kayitlar | Where-Object { $_.ip -like "*$Ip*" } }
if ($SadeceHatalar) { $kayitlar = $kayitlar | Where-Object { $_.status -ge 400 } }

$kayitlar = $kayitlar | Select-Object -Last $Son

if (-not $kayitlar) { Write-Host "Eslesen kayit yok." -ForegroundColor Yellow; return }

if ($Ham) { $kayitlar | ConvertTo-Json -Depth 5; return }

$kayitlar |
    Select-Object `
        @{ n = 'saat';    e = { ([datetime]$_.ts).ToLocalTime().ToString('HH:mm:ss') } },
        @{ n = 'kim';     e = { if ($_.email) { $_.email } else { '(oturumsuz)' } } },
        @{ n = 'rol';     e = { $_.role } },
        @{ n = 'ip';      e = { $_.ip } },
        @{ n = 'islem';   e = { $_.method + ' ' + $_.path } },
        @{ n = 'sonuc';   e = { $_.status } },
        @{ n = 'olay';    e = { $_.evt } },
        @{ n = 'ayrinti'; e = { $_.detail } } |
    Format-Table -AutoSize -Wrap
