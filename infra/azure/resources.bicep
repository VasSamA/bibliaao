// ==========================================================
// Biblia.ao - Recursos Azure (módulo, scope: resource group)
//
// ATENÇÃO: voltar a correr este Bicep substitui a configuração da
// Container App (variáveis de ambiente e segredos) pela que está aqui.
// As restantes variáveis (JWT, OpenAI, CORS, etc.) são copiadas depois
// com copiar-config-api.ps1. Para publicar uma nova versão da API, usar
// o workflow deploy-azure.yml, que só troca a imagem.
// ==========================================================

param location string

@allowed(['dev', 'staging', 'production'])
param environmentName string

param apiImage string
param ghcrUsername string

@secure()
param ghcrToken string

@secure()
param databaseUrl string

@secure()
param directUrl string

param minReplicas int
param maxReplicas int

var prefix = 'biblia-${environmentName}'
var uniqueSuffix = uniqueString(resourceGroup().id)
// Storage account: só minúsculas/números, máx. 24 caracteres, nome global.
var storageAccountName = toLower(take('stbiblia${uniqueSuffix}', 24))
var logAnalyticsName = '${prefix}-logs'
var containerAppsEnvName = '${prefix}-cae'
var apiContainerAppName = '${prefix}-api'
var staticWebAppName = '${prefix}-web'

var useGhcrCredentials = !empty(ghcrToken)
var registrySecrets = useGhcrCredentials ? [ { name: 'ghcr-token', value: ghcrToken } ] : []
var registries = useGhcrCredentials ? [ { server: 'ghcr.io', username: ghcrUsername, passwordSecretRef: 'ghcr-token' } ] : []

// ---------- Observabilidade (logs da Container App) ----------

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
    // Tecto diário de ingestão, para os logs nunca gerarem custos inesperados.
    workspaceCapping: { dailyQuotaGb: json('0.15') }
  }
}

// ---------- Storage (recursos: PDFs, imagens, áudios, vídeos) ----------

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: true
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'PUT', 'POST', 'HEAD']
          allowedHeaders: ['*']
          exposedHeaders: ['*']
          maxAgeInSeconds: 3600
        }
      ]
    }
  }
}

resource resourcesContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'biblia-ao-resources'
  properties: { publicAccess: 'Blob' }
}

// ---------- Container Apps (API) ----------

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppsEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

resource apiContainerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: apiContainerAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 4000
        transport: 'auto'
      }
      registries: registries
      secrets: concat([
        { name: 'database-url', value: databaseUrl }
        { name: 'direct-url', value: directUrl }
      ], registrySecrets)
    }
    template: {
      containers: [
        {
          name: 'api'
          image: apiImage
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'DIRECT_URL', secretRef: 'direct-url' }
            { name: 'NODE_ENV', value: 'production' }
            { name: 'PORT', value: '4000' }
          ]
        }
      ]
      scale: { minReplicas: minReplicas, maxReplicas: maxReplicas }
    }
  }
}

// ---------- Static Web App (Frontend, plano Free) ----------

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  sku: { name: 'Free', tier: 'Free' }
  properties: {
    // O código é publicado pelo deploy-azure.yml com o token de deployment.
    provider: 'GitHub'
  }
}

// Definições da aplicação: o Next.js lê API_URL em runtime, do lado do servidor
// (ex.: página /biblia). Sem isto, as páginas caem no conteúdo de exemplo.
resource staticWebAppSettings 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    API_URL: 'https://${apiContainerApp.properties.configuration.ingress.fqdn}/api/v1'
  }
}

// ---------- Outputs ----------

output apiUrl string = 'https://${apiContainerApp.properties.configuration.ingress.fqdn}'
output webUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output staticWebAppName string = staticWebApp.name
output storageAccountName string = storageAccount.name
