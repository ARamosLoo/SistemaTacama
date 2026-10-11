# Detiene microservicios y frontends locales (la infraestructura Docker sigue arriba).
# Primero los vigilantes (nest/vite) y luego cualquier proceso que siga escuchando en los puertos de la app.
Get-CimInstance Win32_Process -Filter "Name='node.exe' OR Name='powershell.exe'" |
  Where-Object { $_.CommandLine -match 'SistemaTacama' -and $_.CommandLine -match '(nest|vite)' -and $_.ProcessId -ne $PID } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
foreach ($puerto in 3001..3006 + 5173, 5174) {
  Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
Write-Host 'Servicios locales detenidos.'
