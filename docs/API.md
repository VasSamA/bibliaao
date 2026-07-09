# Biblia.ao — Referência da API (resumo)

Documentação interativa completa (Swagger/OpenAPI) disponível em
`GET /docs` quando `apps/api` está a correr. Este ficheiro resume os
grupos de endpoints; prefixo base: `/api/v1`.

| Grupo | Base path | Acesso público | Principais operações |
|---|---|---|---|
| Auth | `/auth` | sim (registo/login) | registo, login, refresh |
| Utilizadores | `/utilizadores` | perfil próprio | perfil, listar (mod+), alterar perfil de acesso (super admin) |
| Bíblia | `/biblia` | sim (leitura) | versões, livros, capítulo, pesquisa, comparação, importar (admin) |
| Estudos | `/estudos` | leitura pública | CRUD (editor+), publicar (moderador+) |
| Devocionais | `/devocionais` | leitura pública | hoje, histórico, CRUD (editor+) |
| Blog | `/blog` | leitura pública | CRUD (editor+) |
| Recursos | `/recursos` | leitura pública | CRUD (editor/líder+), aprovar/rejeitar (moderador+) |
| Academia | `/academia` | leitura pública | cursos, lições, publicar |
| Igrejas | `/igrejas` | leitura pública | submissão pública, aprovar/rejeitar (moderador+), eventos (líder+) |
| Planos de leitura | `/planos-leitura` | leitura pública | iniciar, avançar, progresso (autenticado) |
| Notas | `/notas` | autenticado | CRUD das notas do próprio utilizador |
| Favoritos | `/favoritos` | autenticado | adicionar/remover/listar |
| Comentários | `/comentarios` | leitura pública | criar (autenticado), aprovar/rejeitar (moderador+) |
| Pergunte à Bíblia | `/pergunte-a-biblia` | sim | perguntar (RAG), histórico (autenticado) |
| Notificações | `/notificacoes` | autenticado | listar, marcar lida, difundir (admin) |
| Analytics | `/analytics` | eventos públicos | registar evento, dashboard (admin) |
| Auditoria | `/auditoria` | admin | listar logs |
| Pesquisa | `/pesquisa` | sim | pesquisa unificada |
| Storage | `/storage` | editor+ | URL de upload pré-assinada |

Autenticação: `Authorization: Bearer <accessToken>` (JWT, 15 min por
omissão) + `/auth/refresh` com `refreshToken` (30 dias por omissão).
