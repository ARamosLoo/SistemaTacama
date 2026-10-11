$services = @("auth-service", "catalogo-i18n-service", "maridaje-service", "comandas-service", "inventario-service", "analitica-auditoria-service")
foreach ($s in $services) {
  $prefix = ""
  if ($s -eq "auth-service") { $prefix = "AUTH" }
  if ($s -eq "catalogo-i18n-service") { $prefix = "CATALOGO" }
  if ($s -eq "maridaje-service") { $prefix = "MARIDAJE" }
  if ($s -eq "comandas-service") { $prefix = "COMANDAS" }
  if ($s -eq "inventario-service") { $prefix = "INVENTARIO" }
  if ($s -eq "analitica-auditoria-service") { $prefix = "ANALITICA" }
  
  $content = Get-Content -Path ".env" -Raw
  $varName = "${prefix}_DATABASE_URL"
  $match = [regex]::Match($content, "(?m)^${varName}=(.*)$")
  if ($match.Success) {
    $dbUrl = $match.Groups[1].Value
    $newContent = $content + "`nDATABASE_URL=$dbUrl`n"
    Set-Content -Path "services\$s\.env" -Value $newContent
    Write-Host "Set DATABASE_URL for $s"
  }
}
