# Biblia.ao

Plataforma cloud completa para leitura, estudo e divulgação da Bíblia em Angola e no mundo lusófono.

Ler, estudar, crescer na fé — em qualquer lugar, em qualquer dispositivo.

## Visão geral da arquitetura

```
apps/
  web/    Next.js 14 (App Router) + React + Tailwind — frontend web/PWA
  api/    NestJS — API REST, autenticação RBAC, IA (RAG), integrações
infra/
  docker-compose.yml   Ambiente local (Postgres, Meilisearch, API, Web)
  github/workflows/     CI/CD
docs/
  ARQUITETURA.md        Visão arquitetural completa
  MODELO_DADOS.md        Modelo de dados / schema
  API.md                  Referência de endpoints
```

Ver `docs/ARQUITETURA.md` para o diagrama e explicação completa do sistema
(front-end, back-end, base de dados, storage, serviços externos e infraestrutura cloud).

## Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, TypeScript
- **Backend**: NestJS, TypeScript, Prisma ORM
- **Base de dados**: PostgreSQL (normalizada, ver `docs/MODELO_DADOS.md`)
- **Pesquisa**: Meilisearch (fallback: PostgreSQL Full Text Search)
- **Storage**: Cloudflare R2 / S3 compatível / Azure Blob Storage
- **IA**: RAG (Retrieval-Augmented Generation) sobre conteúdo bíblico aprovado
- **Infraestrutura**: Vercel/Azure (web), Azure Container Apps/Railway (api), CDN, WAF, SSL

## Arranque rápido (desenvolvimento local)

### 1. Pré-requisitos
- Node.js >= 20
- Docker + Docker Compose
- Conta em https://scripture.api.bible/ (chave de API para importar o texto bíblico)

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# preencher DATABASE_URL, API_BIBLE_KEY, JWT secrets, etc.
```

### 3. Subir serviços de infraestrutura (Postgres + Meilisearch)
```bash
npm run docker:up
```

### 4. Instalar dependências
```bash
npm install --workspaces
```

### 5. Base de dados: migrar e popular
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 6. Importar texto bíblico (API.Bible)
```bash
npm run bible:import
```
Isto lê `API_BIBLE_KEY` e `API_BIBLE_VERSION_IDS` do `.env` e popula
`bible_versions`, `bible_books`, `bible_chapters`, `bible_verses`.
Ver `apps/api/src/modules/bible/import/bible-import.service.ts`.

### 7. Arrancar aplicações
```bash
npm run dev:api    # http://localhost:4000  (Swagger em /docs)
npm run dev:web    # http://localhost:3000
```

## Perfis de utilizador (RBAC)

`visitante` → `utilizador_registado` → `estudante` → `líder` → `pastor` →
`editor_conteudo` → `moderador` → `administrador` → `super_administrador`

Ver `docs/ARQUITETURA.md#seguranca-e-rbac` para a matriz de permissões completa.

## Deploy no Azure

A infraestrutura completa (Container Apps, PostgreSQL Flexible Server,
Storage, Key Vault, Azure OpenAI, Static Web App) está definida como
código em `infra/azure/` (Bicep). Ver `infra/azure/README.md` para o
procedimento de provisionamento, e `infra/github/workflows/deploy-azure.yml`
para o deploy contínuo via GitHub Actions.

## Estado do projeto

Este repositório é o **scaffold inicial** da plataforma: estrutura de monorepo,
schema de base de dados completo, autenticação RBAC, módulos de API para todas
as 15 áreas funcionais, e as páginas principais do frontend. Módulos como IA
(RAG) e importação bíblica estão implementados com integrações reais mas
precisam de chaves de API válidas para funcionar em produção. Ver secção
"Próximos passos" em `docs/ARQUITETURA.md`.
