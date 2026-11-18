// ==========================================================
// Biblia.ao - Provisionamento Azure (ponto de entrada)
// Scope: subscription - cria o resource group e invoca o módulo.
//
// Arquitectura da fase de desenvolvimento (Nov. 2026):
//   - Base de dados: Neon (Postgres serverless, fora do Azure)
//   - Imagem da API: GitHub Container Registry (ghcr.io)
//   - API: Azure Container Apps (Consumption, escala até 0 réplicas)
//   - Frontend: Azure Static Web Apps (plano Free)
// Subscrição alvo: Religioso. Ver README.md desta pasta.
// ==========================================================

targetScope = 'subscription'

@description('Nome do resource group da plataforma Biblia.ao')
param resourceGroupName string = 'rg-bibliaao'

@description('Região de todos os recursos. West Europe fica perto do Neon (Frankfurt) e suporta Container Apps e Static Web Apps.')
param location string = 'westeurope'

@description('Ambiente: dev | staging | production (usado nos nomes dos recursos)')
@allowed(['dev', 'staging', 'production'])
param environmentName string = 'production'

@description('Imagem da API, ex.: ghcr.io/vassama/biblia-ao-api:<sha>')
param apiImage string

@description('Utilizador do GitHub com acesso ao pacote no GHCR (vazio se o pacote for público).')
param ghcrUsername string = ''

@description('Token do GitHub (PAT) com permissão read:packages (vazio se o pacote for público).')
@secure()
param ghcrToken string = ''

@description('Connection string do Neon COM pooling (host com "-pooler").')
@secure()
param databaseUrl string

@description('Connection string do Neon DIRECTA (sem pooler), usada pelo prisma migrate.')
@secure()
param directUrl string

@description('Réplicas mínimas da API. 0 = não gasta computação sem pedidos.')
param minReplicas int = 0

@description('Réplicas máximas da API.')
param maxReplicas int = 1

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: {
    projeto: 'biblia-ao'
    ambiente: environmentName
  }
}

module resources 'resources.bicep' = {
  name: 'biblia-ao-resources'
  scope: rg
  params: {
    location: location
    environmentName: environmentName
    apiImage: apiImage
    ghcrUsername: ghcrUsername
    ghcrToken: ghcrToken
    databaseUrl: databaseUrl
    directUrl: directUrl
    minReplicas: minReplicas
    maxReplicas: maxReplicas
  }
}

output resourceGroupName string = rg.name
output apiUrl string = resources.outputs.apiUrl
output webUrl string = resources.outputs.webUrl
output staticWebAppName string = resources.outputs.staticWebAppName
output storageAccountName string = resources.outputs.storageAccountName
