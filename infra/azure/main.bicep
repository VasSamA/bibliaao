// ==========================================================
// Biblia.ao — Provisionamento Azure (ponto de entrada)
// Scope: subscription — cria o resource group e invoca o
// módulo com os recursos.
//
// Deploy:
//   az login
//   az account set --subscription <SUBSCRIPTION_ID>
//   az deployment sub create \
//     --location southafricanorth \
//     --template-file infra/azure/main.bicep \
//     --parameters infra/azure/main.parameters.json
// ==========================================================

targetScope = 'subscription'

@description('Nome do resource group da plataforma Biblia.ao')
param resourceGroupName string = 'rg-biblia-ao'

@description('Região principal (recursos gerais: RG, Storage, PostgreSQL, Key Vault, App Insights). South Africa North tem 3 zonas de disponibilidade e é a região mais próxima de Angola.')
param primaryLocation string = 'southafricanorth'

@description('Região para Azure Container Apps. Nem todos os serviços PaaS mais recentes estão disponíveis em todas as regiões — confirmar em https://azure.microsoft.com/explore/global-infrastructure/products-by-region/ antes do deploy. Por omissão usa-se West Europe por ter cobertura mais ampla; mudar para primaryLocation se/quando Container Apps estiver disponível em South Africa North.')
param computeLocation string = 'westeurope'

@description('Região para Azure OpenAI (Cognitive Services). Disponibilidade de modelos varia por região — confirmar antes do deploy.')
param aiLocation string = 'westeurope'

@description('Região para Azure Static Web Apps (conjunto de regiões restrito: eastus2, centralus, westus2, westeurope, eastasia).')
param webLocation string = 'westeurope'

@description('Ambiente: dev | staging | production')
@allowed(['dev', 'staging', 'production'])
param environmentName string = 'production'

@description('Senha do administrador do PostgreSQL Flexible Server — passar via parâmetro seguro ou Key Vault, nunca committar em texto simples.')
@secure()
param postgresAdminPassword string

@description('Chave de API da API.Bible — usada apenas para popular o Key Vault; a importação corre localmente ou num job.')
@secure()
param apiBibleKey string = ''

@description('Chave de API da OpenAI (fallback caso não se use Azure OpenAI diretamente).')
@secure()
param openAiApiKey string = ''

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: primaryLocation
  tags: {
    projeto: 'biblia-ao'
    ambiente: environmentName
  }
}

module resources 'resources.bicep' = {
  name: 'biblia-ao-resources'
  scope: rg
  params: {
    primaryLocation: primaryLocation
    computeLocation: computeLocation
    aiLocation: aiLocation
    webLocation: webLocation
    environmentName: environmentName
    postgresAdminPassword: postgresAdminPassword
    apiBibleKey: apiBibleKey
    openAiApiKey: openAiApiKey
  }
}

output resourceGroupName string = rg.name
output apiUrl string = resources.outputs.apiUrl
output webUrl string = resources.outputs.webUrl
output storageAccountName string = resources.outputs.storageAccountName
output keyVaultName string = resources.outputs.keyVaultName
