# Deja TacamaMesa lista para una demostración (sin publicar nada: todo corre en esta computadora).
#   pnpm run demo                    levanta el sistema (si hace falta), restablece los datos y genera los QR
#   pnpm run demo -- -SinHistorial   igual, pero sin el historial de ejemplo
param([switch]$SinHistorial)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Puerto($p) { [bool](Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue) }
$puertos = 3001, 3002, 3003, 3004, 3005, 3006, 5173, 5174

# 1. Docker Desktop (si no está en marcha) y el sistema
docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  $dd = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
  if (Test-Path $dd) {
    Write-Host 'Iniciando Docker Desktop (puede tardar un minuto)...'
    Start-Process $dd
    for ($i = 0; $i -lt 60; $i++) { Start-Sleep -Seconds 3; docker info 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { break } }
  }
}
docker info 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) { Write-Error 'Docker no está disponible. Ábralo y vuelva a ejecutar.'; exit 1 }

$sinLevantar = $puertos | Where-Object { -not (Puerto $_) }
if ($sinLevantar) {
  Write-Host 'Levantando el sistema (la primera vez tarda unos minutos: compila los servicios)...'
  # Se lanza aparte y con su salida a un archivo: si se esperara su salida por tubería, los servicios que
  # deja corriendo mantendrían abierta la tubería y este comando nunca terminaría.
  New-Item -ItemType Directory -Force logs | Out-Null
  Start-Process powershell -ArgumentList '-ExecutionPolicy', 'Bypass', '-File', 'scripts/dev-local.ps1' -WindowStyle Hidden `
    -RedirectStandardOutput 'logs/dev-local.out.txt' -RedirectStandardError 'logs/dev-local.err.txt'
}

# 2. Esperar a que todo responda
Write-Host 'Esperando a los servicios...'
for ($i = 0; $i -lt 120; $i++) {
  $faltan = $puertos | Where-Object { -not (Puerto $_) }
  if (-not $faltan) { break }
  if ($i % 5 -eq 0) { Write-Host ('  esperando: ' + ($faltan -join ', ')) }
  Start-Sleep -Seconds 3
}
if ($faltan) { Write-Warning ('No respondieron los puertos: ' + ($faltan -join ', ') + '. Revise la carpeta logs/.') }
Start-Sleep -Seconds 5

# 3. Datos de demostración y QR
if ($SinHistorial) { node scripts/demo-reset.js --sin-historial } else { node scripts/demo-reset.js }
$salidaQr = node scripts/demo-qr.js
$salidaQr | ForEach-Object { Write-Host $_ }
$base = ($salidaQr | Select-String 'apuntando a (\S+)').Matches.Groups[1].Value
Write-Host ''
Write-Host '============================================================'
Write-Host ' DEMO LISTA (sin publicar: solo en esta red)'
Write-Host '============================================================'
Write-Host " Comensal (esta PC):   http://localhost:5173/?mesa=QR-MESA-004"
if ($base) { Write-Host " Comensal (celular):   $base/?mesa=QR-MESA-004   (mismo Wi-Fi)" }
Write-Host ' Personal:             http://localhost:5174'
Write-Host ' QR imprimibles:       docs\demo\qr-mesas.html'
Write-Host ' Guion y cuentas:      docs\DEMO.md'
Write-Host '============================================================'
