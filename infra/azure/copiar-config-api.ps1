<#
.SYNOPSIS
  Copia as variáveis de ambiente e os segredos da API antiga (VASSAMA-HUB)
  para a API nova (Religioso), sem mostrar nenhum valor no ecrã.

.DESCRIPTION
  - Não copia DATABASE_URL, DIRECT_URL, NODE_ENV e PORT (já definidas pelo Bicep, com o Neon).
  - Variáveis que já eram segredos, ou cujo nome contém SECRET/KEY/PASSWORD/TOKEN,
    passam a segredos da Container App (secretref), mesmo que na origem fossem texto literal.
  - Acrescenta a CORS_ORIGINS as origens indicadas em -OrigensCorsExtra.
  - Usa a API REST do Azure (Invoke-AzRestMethod), por isso valores com caracteres
    especiais (! # & %) não são alterados pela linha de comandos.

.EXAMPLE
  ./copiar-config-api.ps1 -OrigensCorsExtra 'https://<novo-site>.azurestaticapps.net'
#>
param(
  [string]$OrigemSubscricao  = '5d8922fe-da9f-42d5-a0c0-cd9471559dd7',   # VASSAMA-HUB
  [string]$DestinoSubscricao = 'a984fd1c-f4ff-468e-a1f7-3156c9eb1fab',   # Religioso
  [string]$ResourceGroup     = 'rg-bibliaao',
  [string]$App               = 'biblia-production-api',
  [string[]]$OrigensCorsExtra = @(),
  [switch]$Simular
)

$ErrorActionPreference = 'Stop'
$api = '2024-03-01'
$ignorar = @('DATABASE_URL', 'DIRECT_URL', 'NODE_ENV', 'PORT')

function Invoke-Arm([string]$Metodo, [string]$Caminho, [string]$Corpo) {
  $p = @{ Method = $Metodo; Path = $Caminho }
  if ($Corpo) { $p.Payload = $Corpo }
  $r = Invoke-AzRestMethod @p
  if ($r.StatusCode -ge 300) { throw "Pedido $Metodo $Caminho falhou ($($r.StatusCode)): $($r.Content)" }
  if ($r.Content) { return ($r.Content | ConvertFrom-Json) }
}

$idOrigem  = "/subscriptions/$OrigemSubscricao/resourceGroups/$ResourceGroup/providers/Microsoft.App/containerApps/$App"
$idDestino = "/subscriptions/$DestinoSubscricao/resourceGroups/$ResourceGroup/providers/Microsoft.App/containerApps/$App"

Write-Host "A ler a API de origem e de destino..."
$appOrigem  = Invoke-Arm GET  "$($idOrigem)?api-version=$api"
$segOrigem  = (Invoke-Arm POST "$idOrigem/listSecrets?api-version=$api").value
$appDestino = Invoke-Arm GET  "$($idDestino)?api-version=$api"
$segDestino = (Invoke-Arm POST "$idDestino/listSecrets?api-version=$api").value

$valoresSegOrigem = @{}
foreach ($s in $segOrigem) { $valoresSegOrigem[$s.name] = $s.value }

# Segredos do destino (mantidos: database-url, direct-url, ghcr-token...)
$segredos = [ordered]@{}
foreach ($s in $segDestino) { $segredos[$s.name] = $s.value }

$contentor = $appDestino.properties.template.containers[0]
$variaveis = [System.Collections.ArrayList]@()
foreach ($e in @($contentor.env)) { [void]$variaveis.Add($e) }

$relatorio = @()
foreach ($e in @($appOrigem.properties.template.containers[0].env)) {
  if ($ignorar -contains $e.name) { continue }

  $valor = if ($e.secretRef) { $valoresSegOrigem[$e.secretRef] } else { $e.value }
  if ($null -eq $valor) { $valor = '' }

  if ($e.name -eq 'CORS_ORIGINS' -and $OrigensCorsExtra.Count -gt 0) {
    $valor = (@($valor -split ',') + $OrigensCorsExtra |
      ForEach-Object { $_.Trim() } | Where-Object { $_ } | Select-Object -Unique) -join ','
  }

  $sensivel = [bool]$e.secretRef -or ($e.name -match 'SECRET|KEY|PASSWORD|TOKEN')
  if ($sensivel) {
    $nomeSegredo = $e.name.ToLower().Replace('_', '-')
    $segredos[$nomeSegredo] = $valor
    $nova = [pscustomobject]@{ name = $e.name; secretRef = $nomeSegredo }
  } else {
    $nova = [pscustomobject]@{ name = $e.name; value = $valor }
  }

  $existente = $variaveis | Where-Object { $_.name -eq $e.name } | Select-Object -First 1
  if ($existente) { [void]$variaveis.Remove($existente) }
  [void]$variaveis.Add($nova)

  $relatorio += [pscustomobject]@{
    Variavel = $e.name
    Tipo     = $(if ($sensivel) { 'segredo' } else { 'valor' })
    Vazia    = [string]::IsNullOrEmpty($valor)
  }
}

$temCors = [bool]($relatorio | Where-Object { $_.Variavel -eq 'CORS_ORIGINS' })
if (-not $temCors -and $OrigensCorsExtra.Count -gt 0) {
  [void]$variaveis.Add([pscustomobject]@{ name = 'CORS_ORIGINS'; value = ($OrigensCorsExtra -join ',') })
  $relatorio += [pscustomobject]@{ Variavel = 'CORS_ORIGINS'; Tipo = 'valor (novo)'; Vazia = $false }
}

Write-Host ($relatorio | Sort-Object Variavel | Format-Table -AutoSize | Out-String -Width 200)

# Avisos úteis (sem mostrar valores)
$prov = ($appOrigem.properties.template.containers[0].env | Where-Object { $_.name -eq 'STORAGE_PROVIDER' }).value
if ($prov -eq 'azure-blob') {
  Write-Warning "STORAGE_PROVIDER=azure-blob: os ficheiros estão na storage account da VASSAMA-HUB. Copiar os blobs e actualizar AZURE_STORAGE_ACCOUNT_NAME/KEY antes de apagar o rg-bibliaao antigo."
}

if ($Simular) { Write-Host "Modo -Simular: nada foi alterado."; return }

$contentor.env = @($variaveis)
$corpo = @{
  properties = @{
    configuration = @{
      secrets = @($segredos.GetEnumerator() | ForEach-Object { @{ name = $_.Key; value = $_.Value } })
    }
    template = $appDestino.properties.template
  }
} | ConvertTo-Json -Depth 30

Write-Host "A actualizar a API de destino..."
Invoke-Arm PATCH "$($idDestino)?api-version=$api" $corpo | Out-Null
Write-Host "Concluído. A Container App vai criar uma nova revisão com a configuração copiada."
