# Настройка переменных Vercel для burnout (Neon + JWT).
# Запуск из корня репозитория: .\scripts\setup-vercel-env.ps1
# Требуется: server/.env с DATABASE_URL и JWT_SECRET, вход в Vercel CLI (npx vercel whoami).

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path "server\.env")) {
  Write-Error "Нет server\.env — скопируйте server\.env.example и укажите Neon DATABASE_URL."
}

$lines = Get-Content "server\.env"
$db = (($lines | Where-Object { $_ -match '^DATABASE_URL=' }) -split '=', 2)[1].Trim()
$jwt = (($lines | Where-Object { $_ -match '^JWT_SECRET=' }) -split '=', 2)[1].Trim()

if (-not $db -or -not $jwt) {
  Write-Error "В server\.env нужны DATABASE_URL и JWT_SECRET."
}

if ($db -match '127\.0\.0\.1|localhost') {
  Write-Error "DATABASE_URL указывает на localhost — для Vercel нужна строка Neon (neon.tech)."
}

Write-Host "Связка с проектом burnout-6w43..."
npx vercel link --yes --project burnout-6w43 | Out-Host

Write-Host "DATABASE_URL (production)..."
npx vercel env add DATABASE_URL production --value $db --yes --force | Out-Host

Write-Host "JWT_SECRET (production)..."
npx vercel env add JWT_SECRET production --value $jwt --yes --force | Out-Host

$prodUrl = "https://burnout-6w43.vercel.app"
Write-Host "PUBLIC_APP_URL (production)..."
npx vercel env add PUBLIC_APP_URL production --value $prodUrl --yes --force | Out-Host

Write-Host ""
Write-Host "Готово. Сделайте redeploy: npx vercel deploy --prod --yes"
Write-Host "Проверка: $prodUrl/api/health (ожидается database: connected)"
