# Levanta TacamaMesa completo en local: infraestructura Docker, 6 microservicios NestJS y las 2 apps React.
# Uso:  pnpm run dev:local          (modo liviano: servicios compilados, recomendado)
#       pnpm run dev:local -- -Watch (modo desarrollo con recarga; consume mucha más memoria)
param([switch]$Watch)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
New-Item -ItemType Directory -Force logs | Out-Null

function MemoriaLibreMB { [int]((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1024) }

Write-Host '1/5 Infraestructura (Postgres, Redis, RabbitMQ, Traefik, sandbox)...'
docker compose up -d postgres redis rabbitmq traefik bodega-sandbox 2>$null | Out-Null

# Si el volumen de RabbitMQ se creó con otra contraseña, los servicios no podrían conectarse: se alinea con el .env
$rabbitListo = $false
for ($i = 0; $i -lt 30 -and -not $rabbitListo; $i++) {
  docker exec tacama-rabbitmq rabbitmqctl await_startup 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $rabbitListo = $true } else { Start-Sleep -Seconds 2 }
}
if ($rabbitListo) {
  $envRaiz = Get-Content (Join-Path $root '.env') | Where-Object { $_ -match '^RABBITMQ_(USER|PASSWORD)=' }
  $mqUser = (($envRaiz | Where-Object { $_ -like 'RABBITMQ_USER=*' }) -replace '^RABBITMQ_USER=', '')
  $mqPass = (($envRaiz | Where-Object { $_ -like 'RABBITMQ_PASSWORD=*' }) -replace '^RABBITMQ_PASSWORD=', '')
  if ($mqUser -and $mqPass) { docker exec tacama-rabbitmq rabbitmqctl change_password $mqUser $mqPass 2>$null | Out-Null }
}

Write-Host '2/5 Variables de entorno por servicio...'
powershell -ExecutionPolicy Bypass -File setup-envs.ps1 | Out-Null

$servicios = [ordered]@{
  'auth-service' = 3001; 'catalogo-i18n-service' = 3002; 'maridaje-service' = 3003;
  'comandas-service' = 3004; 'inventario-service' = 3005; 'analitica-auditoria-service' = 3006
}

Write-Host '3/5 Base de datos (esperar a Postgres, crear tablas y cargar datos si están vacías)...'

# En una instalación nueva Postgres tarda en aceptar conexiones; sin esperarlo, las tablas no se crean
# y la carta responde HTTP 500.
$postgresListo = $false
for ($i = 0; $i -lt 60 -and -not $postgresListo; $i++) {
  docker exec tacama-postgres pg_isready -U tacama_user -d tacamamesa 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $postgresListo = $true } else { Start-Sleep -Seconds 2 }
}
if (-not $postgresListo) { Write-Warning 'Postgres no respondió en 2 minutos. Revise Docker Desktop y el puerto POSTGRES_PORT del .env.' }

foreach ($s in $servicios.Keys) {
  Push-Location "services/$s"
  pnpm exec prisma generate 2>$null | Out-Null
  $creado = $false
  for ($intento = 1; $intento -le 3 -and -not $creado; $intento++) {
    pnpm exec prisma db push --skip-generate --accept-data-loss *> "$root/logs/prisma-$s.log"
    if ($LASTEXITCODE -eq 0) { $creado = $true } else { Start-Sleep -Seconds 4 }
  }
  if (-not $creado) { Write-Warning "No se pudieron crear las tablas de $s. Revise logs/prisma-$s.log" }
  Pop-Location
}

# Cantidad de filas de una tabla (0 si todavía no existe)
function Filas($tabla) {
  $n = docker exec tacama-postgres psql -U tacama_user -d tacamamesa -tAc "select count(*) from $tabla" 2>$null
  if ($LASTEXITCODE -ne 0 -or -not $n) { return 0 }
  return [int]$n
}

# Cada servicio carga sus datos iniciales solo si su tabla principal está vacía
# (el catálogo se carga de cero, así que nunca se repite sobre una carta ya editada)
$semillas = [ordered]@{
  'auth-service' = 'auth.usuarios'; 'catalogo-i18n-service' = 'catalogo.platos'; 'maridaje-service' = 'maridaje.etiquetas';
  'inventario-service' = 'inventario.etiquetas'; 'analitica-auditoria-service' = 'analitica.log_auditoria'
}
foreach ($s in $semillas.Keys) {
  if ((Filas $semillas[$s]) -eq 0) {
    Write-Host "   cargando datos iniciales de $s..."
    Push-Location "services/$s"
    pnpm exec ts-node prisma/seed.ts *> "$root/logs/seed-$s.log"
    if ($LASTEXITCODE -ne 0) { Write-Warning "La carga de datos de $s falló. Revise logs/seed-$s.log" }
    Pop-Location
  }
}
Write-Host ("   carta: " + (Filas 'catalogo.platos') + " platos, bodega: " + (Filas 'inventario.etiquetas') + " etiquetas, cuentas del personal: " + (Filas 'auth.usuarios'))

if (-not $Watch) {
  Write-Host '4/5 Compilando servicios (solo si cambió el código)...'
  foreach ($s in $servicios.Keys) {
    $dir = "services/$s"
    $main = "$dir/dist/main.js"
    $ultimoCambio = (Get-ChildItem "$dir/src", "$dir/prisma/schema.prisma" -Recurse -File | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
    if (-not (Test-Path $main) -or (Get-Item $main).LastWriteTime -lt $ultimoCambio) {
      Write-Host "   compilando $s..."
      Push-Location $dir
      pnpm exec nest build 2>$null | Out-Null
      Pop-Location
    }
  }
}

Write-Host '5/5 Arrancando microservicios y frontends (de a uno, para cuidar la memoria)...'
$libre = MemoriaLibreMB
if ($libre -lt 600) {
  Write-Warning "Memoria libre baja ($libre MB). Cierre navegadores o programas pesados si algún servicio no arranca."
}

function Iniciar($nombre, $dir, $archivo, $argumentos) {
  $log = Join-Path $root "logs/$nombre.log"
  $err = Join-Path $root "logs/$nombre.err.log"
  Start-Process -FilePath node -ArgumentList (@($archivo) + $argumentos) -WorkingDirectory (Join-Path $root $dir) `
    -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $err | Out-Null
}

foreach ($s in $servicios.Keys) {
  $env:PORT = $servicios[$s]
  $env:PORT_ANALITICA = 3006
  if ($Watch) {
    Iniciar $s "services/$s" 'node_modules/@nestjs/cli/bin/nest.js' @('start', '--watch')
  } else {
    Iniciar $s "services/$s" 'dist/main.js' @()
  }
  Start-Sleep -Seconds 3
}

$vite = 'node_modules/vite/bin/vite.js'
Iniciar 'comensal-pwa' 'apps/comensal-pwa' $vite @('--port', '5173', '--host')
Start-Sleep -Seconds 3
Iniciar 'staff-web' 'apps/staff-web' $vite @('--port', '5174', '--host')

Write-Host 'Listo. Comensal: http://localhost:5173  -  Personal: http://localhost:5174  -  Gateway: http://localhost'
Write-Host 'Espere unos segundos a que todos los servicios respondan. Registros en la carpeta logs/.'
