# Biblia.ao — Arquitetura do Sistema

Plataforma Digital para Divulgação do Evangelho.

## Visão geral

```
UTILIZADORES: Visitantes, Cristãos, Líderes, Pastores, Crianças
        │
        ▼
ACESSO: Web · App Mobile (PWA) · API
        │
        ▼
FRONT-END (apps/web) ──► BACK-END / API (apps/api) ──► BASE DE DADOS (PostgreSQL)
        │                        │                              │
        │                        ├──► STORAGE (R2 / S3 / Azure Blob)
        │                        ├──► SERVIÇOS EXTERNOS (OpenAI, E-mail, Maps, Analytics, FCM)
        │                        └──► PAINEL ADMINISTRATIVO (CMS) ──► apps/web/app/admin
        ▼
INFRAESTRUTURA CLOUD: Hospedagem · CDN · Backup · Monitorização · Segurança
```

Esta estrutura corresponde 1:1 ao diagrama de arquitetura original do projeto:
utilizadores → acesso (web/mobile/PWA/API) → front-end → back-end/API → base
de dados + storage + serviços externos → infraestrutura cloud, com o painel
administrativo a atuar transversalmente sobre os módulos de conteúdo.

## Front-end (apresentação) — `apps/web`

Next.js 14 (App Router) + React 18 + Tailwind CSS + TypeScript.

Módulos de página implementados no scaffold: Bíblia Online, Estudos
Bíblicos, Devocional Diário, Perguntas Bíblicas (IA), Recursos & Downloads,
Academia Bíblica, Área Infantil, Mapa de Igrejas, Blog/Artigos, Área de
Líderes, Comunidade, Perfil do Utilizador, e Painel Administrativo.

Experiência de leitura: navegação fluida livro→capítulo→versículo,
pesquisa, comparação de versões, copiar/partilhar/marcar por cor, notas
pessoais por versículo, modo foco, modo claro/escuro, ajuste de tamanho de
fonte. Ver `components/VerseReader.tsx`.

PWA: `public/manifest.json` + metadados em `app/layout.tsx`. Para um
service worker completo (leitura offline), adicionar `next-pwa` ou
`@ducanh2912/next-pwa` ao projeto.

## Back-end / API (lógica do sistema) — `apps/api`

NestJS + TypeScript + Prisma ORM, API REST documentada em Swagger (`/docs`).

Módulos (`src/modules/*`): `auth`, `users`, `bible` (+ `bible/import` para
API.Bible), `studies`, `devotionals`, `articles`, `resources`, `courses`
(Academia), `churches`, `reading-plans`, `notes`, `favorites`, `comments`,
`ai-questions` (RAG), `notifications`, `analytics`, `audit-logs`, `search`,
`storage`.

## Segurança e RBAC {#seguranca-e-rbac}

Hierarquia de perfis (`prisma/schema.prisma` → `UserRole`), do menor para o
maior privilégio:

```
VISITANTE → UTILIZADOR_REGISTADO → ESTUDANTE → LIDER → PASTOR
  → EDITOR_CONTEUDO → MODERADOR → ADMINISTRADOR → SUPER_ADMINISTRADOR
```

- `JwtAuthGuard` (global) valida o token de acesso em todos os endpoints,
  exceto os marcados `@Public()` (ex.: leitura da Bíblia, devocional do dia).
- `RolesGuard` (global) compara o perfil do utilizador autenticado com o
  nível mínimo exigido por `@Roles(...)` num endpoint, usando a hierarquia
  acima (um perfil mais alto satisfaz automaticamente um requisito mais
  baixo).
- Ações de escrita sensíveis podem ser auditadas via
  `AuditLogInterceptor` → tabela `audit_logs`.

Outras medidas implementadas ou previstas no scaffold: Helmet (cabeçalhos
HTTP seguros), `class-validator` (validação/whitelist de payloads,
proteção contra over-posting), `@nestjs/throttler` (rate limiting),
`argon2` (hash de senhas), validação de tipo MIME em uploads
(`storage.service.ts`), CORS restrito por `CORS_ORIGINS`. Faltam para
produção: WAF (nível de infraestrutura/CDN), rotação de segredos via
vault/gestor de segredos da cloud escolhida, testes de penetração.

## IA Bíblica — "Pergunte à Bíblia" (RAG)

Ver `apps/api/src/modules/ai-questions/ai-questions.service.ts`.

1. **Recuperação**: pesquisa versículos e estudos/devocionais aprovados que
   contenham palavras-chave da pergunta (full-text search local; em escala,
   substituir por pesquisa vetorial com embeddings — `OPENAI_EMBEDDING_MODEL`
   já está reservado no `.env.example` para essa evolução).
2. **Geração**: envia a pergunta + os trechos recuperados como contexto ao
   modelo (`OPENAI_MODEL`), com instrução explícita de responder apenas com
   base nesse contexto e citar as referências usadas.
3. **Apresentação**: a resposta é devolvida junto das referências bíblicas
   usadas (`referencesUsed`), para o utilizador verificar diretamente na
   Bíblia — a IA nunca substitui a leitura das Escrituras.

Sem `OPENAI_API_KEY` configurada, o endpoint devolve as referências
encontradas sem geração de texto (modo degradado, não bloqueante).

## Base de dados (PostgreSQL)

Ver `docs/MODELO_DADOS.md` e `apps/api/prisma/schema.prisma` para o
detalhe completo. Tabelas principais: `users`, `permissions`,
`bible_versions/books/chapters/verses`, `studies`, `devotionals`,
`articles`, `resources`, `courses`, `churches`, `reading_plans`,
`user_notes`, `user_favorites`, `comments`, `ai_questions`,
`notifications`, `audit_logs`, `analytics_events`.

## Storage de ficheiros

Abstração compatível com S3 (`apps/api/src/modules/storage`), funciona com
Cloudflare R2, AWS S3 ou qualquer serviço S3-compatível via
`STORAGE_ENDPOINT`. Uploads usam URLs pré-assinadas (o ficheiro vai direto
do browser para o storage, sem passar pela API) e são validados por tipo
MIME por categoria antes de emitir a URL.

## Pesquisa

Implementação inicial: PostgreSQL (`ILIKE`/full text) em
`apps/api/src/modules/search`. `infra/docker-compose.yml` já sobe uma
instância de Meilisearch para quando a pesquisa precisar de escalar —
substituir a implementação interna do `SearchService` mantendo a mesma
interface pública.

## Infraestrutura cloud (alvo de produção)

| Camada | Opção recomendada |
|---|---|
| Frontend (`apps/web`) | Vercel ou Azure App Service |
| Backend (`apps/api`) | Azure Container Apps, Railway, ou Azure App Service |
| Base de dados | PostgreSQL gerido (Azure Database for PostgreSQL, Neon, Supabase, RDS) |
| Storage | Cloudflare R2 ou Azure Blob Storage |
| CDN | Cloudflare |
| WAF / SSL | Cloudflare / Azure Front Door |
| Backup | Automático, gerido pelo provedor de base de dados |
| Monitorização/Logs | Provider APM (ex: Azure Monitor, Better Stack) + logs estruturados da API |
| CI/CD | `infra/github/workflows/ci.yml` (build + lint + prisma migrate deploy + npm audit) |

Ambientes recomendados: `development` (local, `infra/docker-compose.yml`),
`staging`, `production` — cada um com a sua própria `DATABASE_URL` e
segredos geridos pelo vault do provedor cloud (nunca commitados).

## Provisionamento Azure (Bicep)

`infra/azure/main.bicep` + `infra/azure/resources.bicep` provisionam a
subscrição Azure do utilizador com: resource group, Container Apps
(API), Static Web App (frontend), PostgreSQL Flexible Server, Storage
Account, Key Vault, Container Registry, Azure OpenAI, Log Analytics +
Application Insights. Região principal por omissão: South Africa North
(mais próxima de Angola); Container Apps/Azure OpenAI/Static Web Apps
usam West Europe por omissão até se confirmar disponibilidade desses
serviços em South Africa North (parâmetros independentes no Bicep — ver
`infra/azure/README.md`). O deploy contínuo fica em
`infra/github/workflows/deploy-azure.yml`, autenticado via OIDC
(sem segredos de longa duração no repositório).

## Próximos passos

Este scaffold cobre a estrutura completa do sistema e módulos funcionais
com CRUD real ligado à base de dados. Para produção, falta: popular a
Bíblia completa via `npm run bible:import` com uma chave de API.Bible
válida; testes automatizados (unitários e e2e); interface administrativa
completa (tabelas com paginação/filtros/formulários — atualmente as
páginas em `apps/web/app/admin/*` são placeholders ligados aos endpoints
protegidos); pesquisa vetorial para a IA; service worker PWA para leitura
offline; internacionalização (pt-AO como padrão, preparar para outras
variantes do português); testes de carga e penetração antes do lançamento.
