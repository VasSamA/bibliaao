# Biblia.ao - Infraestrutura Azure (Bicep)

## Arquitectura actual (fase de desenvolvimento, Nov. 2026)

| Componente | Serviço | Custo esperado |
|---|---|---|
| Base de dados | **Neon** (Postgres serverless, Frankfurt), fora do Azure | 0 (plano Free) |
| Imagem da API | **GitHub Container Registry** (`ghcr.io/vassama/biblia-ao-api`) | 0 |
| API (NestJS) | Azure Container Apps, Consumption, 0 a 1 réplicas | ~0 (quota gratuita) |
| Frontend (Next.js) | Azure Static Web Apps, plano **Free** | 0 |
| Ficheiros | Storage Account (Standard_LRS) | cêntimos |
| Logs | Log Analytics, com tecto diário de 0,15 GB | ~0 |

- Subscrição: **Religioso** (`a984fd1c-f4ff-468e-a1f7-3156c9eb1fab`), resource group `rg-bibliaao`, região **West Europe**.
- Deixaram de existir: PostgreSQL Flexible Server, Azure Container Registry, Key Vault,
  Application Insights e Azure OpenAI (a API usa a OpenAI directamente, via `OPENAI_API_KEY`).
- Prisma: `DATABASE_URL` é a ligação com pooling (aplicação) e `DIRECT_URL` a ligação
  directa (só para `prisma migrate`). Ver `apps/api/prisma/schema.prisma`.

**Atenção:** voltar a correr o Bicep repõe a configuração da Container App e apaga as
variáveis copiadas pelo `copiar-config-api.ps1`. Para publicar uma nova versão da API,
usar o workflow `deploy-azure.yml`, que só troca a imagem.

---

## Migração VASSAMA-HUB -> Religioso (Nov. 2026)

Pré-requisitos já feitos: base de dados exportada do Azure e restaurada no Neon
(29 tabelas, contagens confirmadas). Correr os passos em PowerShell, na raiz do repositório.

### 1. Publicar o branch e construir a imagem da API

```powershell
git push -u origin migracao-neon-religioso
```

No GitHub: **Actions > Deploy Azure - Biblia.ao > Run workflow**, branch
`migracao-neon-religioso`, alvo **imagem-api**. No fim existe
`ghcr.io/vassama/biblia-ao-api:latest`.

Acesso da Container App ao pacote (escolher um):
- **Privado (recomendado):** criar um token clássico em GitHub > Settings > Developer
  settings > Personal access tokens, só com `read:packages`.
- **Público:** em Packages > biblia-ao-api > Package settings > Change visibility. Nesse
  caso deixar `ghcrToken` vazio.

### 2. Criar os recursos na subscrição Religioso

As connection strings do Neon têm `&`, que o `az` no Windows interpreta mal. Por isso o
deploy é feito com o Az PowerShell, a partir do JSON compilado.

```powershell
Set-AzContext -Subscription 'a984fd1c-f4ff-468e-a1f7-3156c9eb1fab'
'Microsoft.App','Microsoft.OperationalInsights','Microsoft.Web','Microsoft.Storage' |
  ForEach-Object { Register-AzResourceProvider -ProviderNamespace $_ | Out-Null }

az bicep build --file infra/azure/main.bicep --outfile infra/azure/main.json

$neonPool   = Read-Host 'Neon - connection string COM pooling' -MaskInput
$neonDirect = Read-Host 'Neon - connection string directa' -MaskInput
$ghcrToken  = Read-Host 'Token GitHub read:packages (Enter se o pacote for público)' -MaskInput

$out = New-AzSubscriptionDeployment -Name 'biblia-ao-religioso' -Location 'westeurope' `
  -TemplateFile infra/azure/main.json -TemplateParameterObject @{
    apiImage     = 'ghcr.io/vassama/biblia-ao-api:latest'
    ghcrUsername = 'VasSamA'
    ghcrToken    = $ghcrToken
    databaseUrl  = $neonPool
    directUrl    = $neonDirect
  }
$out.Outputs.apiUrl.Value; $out.Outputs.webUrl.Value
Remove-Item infra/azure/main.json
```

### 3. Copiar a configuração da API antiga

Copia JWT, OpenAI, CORS, storage, etc. da API na VASSAMA-HUB, sem mostrar valores.
Primeiro em modo de simulação, depois a sério:

```powershell
./infra/azure/copiar-config-api.ps1 -OrigensCorsExtra $out.Outputs.webUrl.Value -Simular
./infra/azure/copiar-config-api.ps1 -OrigensCorsExtra $out.Outputs.webUrl.Value
```

Testar: `Invoke-RestMethod "$($out.Outputs.apiUrl.Value)/api/v1/biblia/versoes"`.

### 4. Actualizar o GitHub

Secrets (Settings > Secrets and variables > Actions):

| Secret | Valor |
|---|---|
| `AZURE_SUBSCRIPTION_ID` | `a984fd1c-f4ff-468e-a1f7-3156c9eb1fab` |
| `AZURE_RESOURCE_GROUP` | `rg-bibliaao` |
| `AZURE_CONTAINER_APP_NAME` | `biblia-production-api` |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | `az staticwebapp secrets list -n biblia-production-web -g rg-bibliaao --query properties.apiKey -o tsv` |
| `DATABASE_URL` | Neon, com pooling |
| `DIRECT_URL` | Neon, directa |
| `API_URL` | `<apiUrl>/api/v1` |

Variável (separador Variables): `API_PUBLIC_URL` = `<apiUrl>/api/v1`.
Pode apagar o secret `AZURE_CONTAINER_REGISTRY`.

Dar à App Registration do GitHub (OIDC) acesso ao novo resource group:

```powershell
$cid = '<valor do secret AZURE_CLIENT_ID>'
New-AzRoleAssignment -ApplicationId $cid -RoleDefinitionName 'Contributor' `
  -Scope '/subscriptions/a984fd1c-f4ff-468e-a1f7-3156c9eb1fab/resourceGroups/rg-bibliaao'
```

### 5. Publicar o site e validar

A definição `API_URL` da Static Web App (lida pelo Next.js em runtime) já é criada pelo
Bicep. Se faltar, a página `/biblia` mostra a lista de exemplo (ARA, 4 livros):
`az staticwebapp appsettings set -n biblia-production-web -g rg-bibliaao --setting-names "API_URL=<apiUrl>/api/v1"`.

Run workflow no branch `migracao-neon-religioso`, alvo **web**. Abrir `<webUrl>` e
confirmar leitura da Bíblia, pesquisa, login e "Pergunte à Bíblia".

### 6. Domínios biblia.ao e www.biblia.ao

1. Remover os domínios da Static Web App antiga (VASSAMA-HUB > biblia-production-web > Domínios personalizados).
2. Adicioná-los na nova (Religioso) e actualizar o DNS: `www` como CNAME para o novo
   `*.azurestaticapps.net`; `biblia.ao` com o registo TXT de validação e ALIAS/A indicado pelo portal.

### 7. Fechar

1. Fazer merge do branch para `main` (o push dispara o deploy completo).
2. Apagar o resource group `rg-bibliaao` na VASSAMA-HUB (PostgreSQL parado, ACR,
   Key Vault, Azure OpenAI, conta de Automation `aa-biblia-pg-guard`, Static Web App antiga).
