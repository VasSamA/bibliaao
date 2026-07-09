# Biblia.ao — Modelo de Dados

Fonte da verdade: `apps/api/prisma/schema.prisma`. Este documento é um
resumo legível; em caso de divergência, o schema Prisma prevalece.

## Utilizadores e acesso

- **users** — dados de perfil, `role` (enum `UserRole`, RBAC), tema/tamanho
  de fonte preferidos, estado da conta.
- **permissions** / **user_permissions** — permissões granulares
  adicionais além do perfil (ex.: `content.publish`, `users.manage`),
  many-to-many.
- **refresh_tokens** — tokens de atualização de sessão (JWT).

## Bíblia

- **bible_versions** — versões/traduções (ex. ARA, NVI), com
  `externalId`/`source` para rastrear a origem (API.Bible).
- **bible_books** — livros por versão, com `testament` (AT/NT) e `order`.
- **bible_chapters** — capítulos por livro, `audioUrl` opcional (Áudio
  Bíblia).
- **bible_verses** — versículos por capítulo, `reference` textual pronta
  para exibição/partilha (ex. "João 3:16").

## Conteúdo editorial

- **studies** (Estudos Bíblicos), **devotionals** (Devocional Diário),
  **articles** (Blog) — todos com `status` (`ContentStatus`: RASCUNHO →
  PENDENTE_APROVACAO → PUBLICADO / ARQUIVADO / REJEITADO), autor
  (`authorId` → users), e campos de SEO/categoria/tags onde aplicável.
- **resources** — biblioteca de recursos (PDF, slide, imagem, áudio,
  vídeo, certificado), com `audience` (ex. "lideres", "infantil"),
  contagem de downloads, e fluxo de aprovação.
- **courses** / **course_lessons** — Academia Bíblica.

## Igrejas e eventos

- **churches** — igrejas submetidas por utilizadores, com geolocalização
  (`latitude`/`longitude` para o Mapa de Igrejas) e fluxo de aprovação
  (`ChurchStatus`).
- **church_events** — eventos associados a uma igreja.

## Planos de leitura e progresso pessoal

- **reading_plans** / **reading_plan_days** — planos com dias e
  referências bíblicas associadas.
- **reading_plan_progress** — progresso do utilizador por plano
  (dia atual, início, conclusão).
- **reading_history** — histórico simples de leitura por referência.

## Personalização e comunidade

- **user_notes** — notas pessoais, ligadas opcionalmente a um versículo
  específico (`verseId`) e sempre a uma referência textual.
- **user_favorites** — versículos favoritos, com marcação por cor
  (`colorTag`).
- **comments** — comentários (com respostas via `parentId`
  auto-relacionado) em estudos, artigos ou devocionais, com fluxo de
  moderação (`CommentStatus`).

## IA e observabilidade

- **ai_questions** — histórico de perguntas ao módulo "Pergunte à
  Bíblia", incluindo `referencesUsed`, `sourceChunks` (contexto RAG),
  modelo usado e latência — permite auditar e melhorar a qualidade das
  respostas ao longo do tempo.
- **notifications** — notificações por utilizador (e-mail, push, in-app).
- **audit_logs** — trilha de auditoria de ações sensíveis (quem, quê,
  quando, IP/user-agent).
- **analytics_events** — eventos de uso livres (`eventName` +
  `properties` JSON) para alimentar o dashboard administrativo.

## Índices e integridade

O schema usa `@@unique` e `@@index` nas combinações mais consultadas
(ex.: `bible_verses(chapterId, number)`, `studies(status)`,
`churches(province, city)`, `analytics_events(eventName, createdAt)`) e
`onDelete: Cascade`/`SetNull` explícitos para manter integridade
referencial sem deixar registos órfãos silenciosos.
