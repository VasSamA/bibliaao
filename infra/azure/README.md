# Biblia.ao — Provisionamento Azure (Bicep)

Provisiona toda a infraestrutura Azure da plataforma: resource group,
Container Apps (API), Static Web App (frontend), PostgreSQL Flexible
Server, Storage Account (recursos), Key Vault (segredos), Azure OpenAI
(IA Bíblica), Container Registry, Log Analytics + Application Insights.

## Sobre as regiões

`primaryLocation` (South Africa North por omissão) aloja o resource group,
a base de dados, o storage, o Key Vault e a observabilidade — é a região
Azure geograficamente mais próxima de Angola e tem 3 zonas de
disponibilidade.

Alguns serviços PaaS mais recentes (Container Apps, Azure OpenAI, Static
Web Apps) podem não estar disponíveis em todas as regiões a qualquer
momento — por isso `computeLocation`, `aiLocation` e `webLocation` são
parâmetros **separados**, com West Europe como omissão segura. Antes de um
deploy real, confirmar disponibilidade atualizada em
https://azure.microsoft.com/explore/global-infrastructure/products-by-region/
e ajustar `main.parameters.json` se South Africa North já suportar esses
serviços — isso reduz latência entre a API e a base de dados.

## Pré-requisitos

- Azure CLI (`az`) autenticado: `az login`
- Bicep instalado: `az bicep install`
- Uma subscrição Azure ativa: `az account set --subscription <ID>`

## Deploy

```bash
az deployment sub create \
  --name biblia-ao-$(date +%Y%m%d%H%M) \
  --location southafricanorth \
  --template-file main.bicep \
  --parameters main.parameters.json \
  --parameters postgresAdminPassword='<senha-forte>' \
  --parameters apiBibleKey='<chave-api.bible>' \
  --parameters openAiApiKey='<chave-openai-opcional>'
```

Não passar segredos como valores fixos em `main.parameters.json` —
usar sempre `--parameters chave=valor` na linha de comandos (ou, melhor
ainda, referências ao Key Vault num pipeline de CI/CD com identidade
gerida).

## Depois do deploy

1. Anotar os outputs (`apiUrl`, `webUrl`, `storageAccountName`,
   `keyVaultName`, `containerRegistryLoginServer`, `openAiEndpoint`).
2. Criar o deployment do modelo no Azure OpenAI (não incluído no Bicep
   por depender de quota/região):
   ```bash
   az cognitiveservices account deployment create \
     --name <openAiAccountName> --resource-group rg-biblia-ao \
     --deployment-name gpt-4o-mini --model-name gpt-4o-mini \
     --model-version "2024-07-18" --model-format OpenAI \
     --sku-capacity 10 --sku-name Standard
   ```
3. Atualizar o `.env`/segredos do Container App com `STORAGE_ENDPOINT`,
   `STORAGE_ACCOUNT_NAME`, `DATABASE_URL` (já configurado automaticamente
   pelo Bicep) e o endpoint do Azure OpenAI.
4. Ligar o `deploy-azure.yml` (GitHub Actions) para publicar
   automaticamente a API (Container App) e o frontend (Static Web App)
   a cada push em `main`.
