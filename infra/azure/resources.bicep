// ==========================================================
// Biblia.ao — Recursos Azure (módulo, scope: resource group)
// ==========================================================

@description('Região principal (RG, Storage, PostgreSQL, Key Vault, App Insights).')
param primaryLocation string

@description('Região para Azure Container Apps.')
param computeLocation string

@description('Região para Azure OpenAI.')
param aiLocation string

@description('Região para Azure Static Web Apps.')
param webLocation string

@allowed(['dev', 'staging', 'production'])
param environmentName string

@secure()
param postgresAdminPassword string

@secure()
param apiBibleKey string

@secure()
param openAiApiKey string

var prefix = 'biblia-${environmentName}'
var storageAccountName = replace('st${prefix}${uniqueString(resourceGroup().id)}', '-', '')
var postgresServerName = '${prefix}-pg'
var keyVaultName = take('kv-${prefix}-${uniqueString(resourceGroup().id)}', 24)
var acrName = replace('acr${prefix}${uniqueString(resourceGroup().id)}', '-', '')
var logAnalyticsName = '${prefix}-logs'
var appInsightsName = '${prefix}-insights'
var containerAppsEnvName = '${prefix}-cae'
var apiContainerAppName = '${prefix}-api'
var staticWebAppName = '${prefix}-web'
var openAiAccountName = '${prefix}-openai'

// ---------- Observabilidade ----------

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: primaryLocation
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: primaryLocation
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ---------- Key Vault ----------

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: primaryLocation
  properties: {
    sku: { family: 'A', name: 'standard' }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

resource secretPostgresPassword 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'postgres-admin-password'
  properties: { value: postgresAdminPassword }
}

resource secretApiBibleKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(apiBibleKey)) {
  parent: keyVault
  name: 'api-bible-key'
  properties: { value: apiBibleKey }
}

resource secretOpenAiKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(openAiApiKey)) {
  parent: keyVault
  name: 'openai-api-key'
  properties: { value: openAiApiKey }
}

// ---------- Storage (recursos: PDFs, imagens, áudios, vídeos) ----------

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: primaryLocation
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

// ---------- Base de dados: PostgreSQL Flexible Server ----------

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01-preview' = {
  name: postgresServerName
  location: primaryLocation
  sku: {
    name: environmentName == 'production' ? 'Standard_D2ds_v4' : 'Standard_B1ms'
    tier: environmentName == 'production' ? 'GeneralPurpose' : 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: 'biblia_admin'
    administratorLoginPassword: postgresAdminPassword
    storage: { storageSizeGB: 32 }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01-preview' = {
  parent: postgresServer
  name: 'biblia_ao'
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}

resource postgresFirewallAllowAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01-preview' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}

// ---------- Registo de contentores ----------

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: computeLocation
  sku: { name: 'Basic' }
  properties: { adminUserEnabled: true }
}

// ---------- Container Apps (API) ----------

resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppsEnvName
  location: computeLocation
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
  location: computeLocation
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 4000
        transport: 'auto'
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        { name: 'acr-password', value: acr.listCredentials().passwords[0].value }
        { name: 'database-url', value: 'postgresql://biblia_admin:${postgresAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/biblia_ao?sslmode=require' }
      ]
    }
    template: {
      // Nota: imagem placeholder — o pipeline de CI/CD (deploy-azure.yml) atualiza
      // esta Container App com a imagem real após cada build da API.
      containers: [
        {
          name: 'api'
          image: 'mcr.microsoft.com/k8se/quickstart:latest'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'NODE_ENV', value: environmentName == 'production' ? 'production' : 'development' }
          ]
        }
      ]
      scale: { minReplicas: environmentName == 'production' ? 1 : 0, maxReplicas: 5 }
    }
  }
}

// ---------- Static Web App (Frontend) ----------

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: webLocation
  sku: { name: 'Standard', tier: 'Standard' }
  properties: {
    // repositoryUrl / branch / buildProperties preenchidos no primeiro deploy
    // via `az staticwebapp` CLI ou GitHub Actions (ver deploy-azure.yml).
    provider: 'GitHub'
  }
}

// ---------- Azure OpenAI (IA Bíblica) ----------

resource openAiAccount 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: openAiAccountName
  location: aiLocation
  kind: 'OpenAI'
  sku: { name: 'S0' }
  properties: {
    customSubDomainName: openAiAccountName
    publicNetworkAccess: 'Enabled'
  }
}

// Nota: o deployment do modelo (ex: gpt-4o-mini) não está incluído aqui porque
// a disponibilidade de modelos varia por região/quota e é melhor confirmada e
// criada via `az cognitiveservices account deployment create` após o provisionamento
// da conta, ou pelo portal Azure AI Foundry.

// ---------- Outputs ----------

output apiUrl string = 'https://${apiContainerApp.properties.configuration.ingress.fqdn}'
output webUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output storageAccountName string = storageAccount.name
output storageBlobEndpoint string = storageAccount.properties.primaryEndpoints.blob
output postgresHost string = postgresServer.properties.fullyQualifiedDomainName
output keyVaultName string = keyVault.name
output containerRegistryLoginServer string = acr.properties.loginServer
output openAiEndpoint string = openAiAccount.properties.endpoint
