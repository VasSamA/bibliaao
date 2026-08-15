# Biblia.ao — Handoff para Claude Code

Última atualização: 2026-08-14

Este ficheiro existe para retomar o trabalho de deploy/infra sem perder o contexto
acumulado numa longa sessão de debugging no Cowork. Lê isto primeiro.

## O que é o projeto

Plataforma cloud completa para leitura/estudo/evangelização da Bíblia em Angola e
no mundo lusófono. Ver `README.md` e `docs/ARQUITETURA.md` para a visão completa.

- `apps/web` — Next.js 14 (App Router), Tailwind
- `apps/api` — NestJS + Prisma ORM
- PostgreSQL (Azure Flexible Server)
- Deploy: Azure (Container Apps para a API, Static Web Apps para o web)
- Região: South Africa North (recursos), exceto Static Web App que ficou em West Europe

## Recursos Azure (produção)

- Resource group: `rg-bibliaao`
- Container App (API): `biblia-production-api`
  - URL pública: `https://biblia-production-api.victoriousplant-a5611e3c.westeurope.azurecontainerapps.io/api/v1`
- Static Web App (frontend): via GitHub Actions, secret `AZURE_STATIC_WEB_APPS_API_TOKEN`
- ACR: `acrbibliaproductionuwvxyigge57t4`
- PostgreSQL Flexible Server: `biblia-production-pg` (nota: nome não segue o padrão do Bicep
  `resources.bicep` devido a um dessincronismo de push na altura do deploy inicial — não bloqueante)
- Para obter secrets reais (DATABASE_URL, acr-password, etc.), nunca embutir aqui — correr:
  ```
  az containerapp secret list --name biblia-production-api --resource-group rg-bibliaao --show-values
  ```

## Credenciais de admin

- Login: `admin@biblia.ao` — senha foi trocada pelo utilizador via `/perfil/definicoes`
  (funcionalidade construída nesta sessão). Não está guardada aqui.
- **Password apareceu em texto claro num screenshot partilhado nesta sessão
  (2026-07-11)** — mudar de novo por precaução (ver Pendências).

## Incidente resolvido: outage de autenticação à BD (2026-07-11)

- **Sintoma**: `GET /biblia/versoes` e tudo o resto a devolver 500 "Erro interno do
  servidor.".
- **Causa raiz encontrada nos logs**: `PrismaClientInitializationError` / `P1000`
  — "Authentication failed... for `biblia_admin` are not valid". O utilizador tinha
  mudado a password do Postgres diretamente no servidor (`az postgres flexible-server
  update --admin-password`, visto no Activity Log, duas vezes entre 13:49 e 14:14 UTC)
  mas nada tinha atualizado a app para usar a password nova.
- **Armadilha que custou tempo a diagnosticar**: existe um secret chamado
  `database-url` na Container App (atualizei-o para a password nova, sem efeito
  nenhum) — mas **o env var `DATABASE_URL` real do container estava definido como
  valor LITERAL fixo** (`postgresql://biblia_admin:BibliaAoCloud2026Prod@...`),
  **não como `secretref:database-url`**. Ou seja, o secret existia mas não estava a
  ser usado por nada — provavelmente um resquício de uma versão anterior do Bicep.
  Confirmar sempre com:
  ```
  az containerapp show --name biblia-production-api --resource-group rg-bibliaao \
    --query "properties.template.containers[0].env"
  ```
  Se `DATABASE_URL` aparecer com `"value": "postgresql://..."` em vez de referenciar
  o secret, é isto.
- **Fix aplicado**: gerada nova password alfanumérica (evita os `!`/`#` que já deram
  problemas antes), aplicada no servidor Postgres, secret `database-url` atualizado,
  e o env var corrigido para `secretref:database-url` via
  `az containerapp update --set-env-vars "DATABASE_URL=secretref:database-url"`.
  Confirmado com `SELECT 1` via Prisma local (precisa de regra de firewall temporária
  para o IP local, ver abaixo) e depois via `GET /biblia/versoes` em produção — voltou
  a 200. Dados da Bíblia (JFA, 66 livros) confirmados intactos.
- **Nota de segurança pendente**: `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET` no mesmo
  container também são valores literais (não `secretref`) — visíveis em texto claro a
  quem tiver acesso de leitura à Container App. Considerar mover para secrets também,
  por consistência (não é urgente, o nível de acesso necessário para os ver é o
  mesmo que já seria preciso para os secrets).
- **Firewall do Postgres**: só tem a regra `AllowAzureServices` (0.0.0.0/0.0.0.0, o
  valor especial do Azure, não "todos os IPs"). Para testar ligação a partir de uma
  máquina local é preciso adicionar uma regra temporária com o IP público
  (`curl https://api.ipify.org`) via `az postgres flexible-server firewall-rule
  create --resource-group rg-bibliaao --server-name biblia-production-pg --name X
  --start-ip-address <ip> --end-ip-address <ip>` — **lembrar sempre de remover a
  seguir** (`firewall-rule delete ... --yes`).

## Ciclo de deploy da API (manual — CI/CD automático ainda não funciona, ver "Pendências")

**Atualização 2026-07-11**: já não é preciso a Cloud Shell — `az` CLI foi instalado
nesta máquina Windows local (`winget install Microsoft.AzureCLI`) e autenticado com
`az login` (conta `osvaldo.manuel@vassama.ao`, tenant VASSAMA). O recurso está na
subscrição **VASSAMA-HUB** (`5d8922fe-da9f-42d5-a0c0-cd9471559dd7`) — confirmar com
`az account set --subscription 5d8922fe-da9f-42d5-a0c0-cd9471559dd7` antes de correr
comandos, já que a conta tem 6 subscrições. Nota: `az containerapp logs show --tail`
aceita no máximo 300.

Sempre que houver alterações em `apps/api` (local ou Cloud Shell, equivalente):

```powershell
# 1. Local:
git add -A && git commit -m "..." && git push

# 2. Build (local, já não precisa de Cloud Shell):
cd apps/api
az acr build --registry acrbibliaproductionuwvxyigge57t4 --image biblia-ao-api:latest .
# corre em ACR Tasks na cloud — se o streaming local der timeout, o build pode já ter
# terminado; confirmar com `az acr task list-runs --registry acrbibliaproductionuwvxyigge57t4 --top 5 -o table`
az acr repository show-manifests --name acrbibliaproductionuwvxyigge57t4 --repository biblia-ao-api --top 1 --orderby time_desc -o table
# copiar o digest sha256:... do output

# 3. Aplicar a nova imagem:
az containerapp update --name biblia-production-api --resource-group rg-bibliaao `
  --image acrbibliaproductionuwvxyigge57t4.azurecr.io/biblia-ao-api@sha256:<digest>
```

O frontend (`apps/web`) já publica sozinho via GitHub Actions (`deploy-web` job) a cada
push — esse job funciona. O job `deploy-api` no mesmo workflow **falha sempre**
(ver Pendências) — o deploy da API continua a ser manual pelos passos acima.

## Bugs já resolvidos (não repetir o diagnóstico)

- **Storage account name > 24 chars** → Bicep usa `toLower(take('stbiblia${uniqueSuffix}', 24))`.
- **Password do Postgres com `#`** → parte a query string em alguns parsers. Resolvido
  trocando a password para algo alfanumérico numa altura, mas o secret atual
  (`database-url` na Container App) ainda tem `!` e `#` e funciona bem no runtime da API
  (Prisma lê a string tal como está, sem passar por `URL()`). Só dá problema se colares essa
  string num contexto que faça parsing de URL de outra forma (ex.: alguns comandos CLI).
- **Container crash `Cannot find module dist/main`** → `tsconfig.json` sem `rootDir`
  fazia `prisma/seed.ts` entrar na compilação e mudar a estrutura do `dist/`. Fixado com
  `"rootDir": "./src"` + `include`/`exclude` explícitos.
- **Container crash `libssl.so.1.1`** → imagem base `node:20-alpine` (musl + OpenSSL 3.x)
  incompatível com o engine do Prisma. Fixado trocando para `node:20-slim` (Debian) no
  `apps/api/Dockerfile`.
- **GitHub Actions não aparecia** → workflows estavam em `infra/github/workflows/` em vez
  de `.github/workflows/` (única pasta que o GitHub reconhece automaticamente).
- **Azure Static Web Apps intercepta `/api/*`** → é um path reservado pela integração de
  Functions do SWA. O frontend chama a Container App diretamente (CORS já configurado),
  ver `apps/web/lib/api.ts`.
- **Login "Erro 404"** → consequência direta do ponto anterior, resolvido junto.
- **Bible import "morria" a meio (ficava preso num livro só)** → causa raiz: qualquer
  erro dentro da importação (rede, bloqueio Cloudflare da Midvash API, erro de BD) que
  não fosse apanhado rejeitava a promise do controller sem `.catch()`, e o Node crasha
  o processo inteiro em promise rejection não tratada (default desde Node 15). A
  Container App reiniciava um novo container, perdendo o progresso. Fixado em
  `bible-import.service.ts` (try/catch à volta de cada livro inteiro, não só do
  capítulo) e em `bible.controller.ts` (`.catch()` no disparo da importação).
- **Cloud Shell bloqueada pela Cloudflare da api.midvash.com** — pedidos a partir da
  Cloud Shell recebem uma página de desafio Cloudflare ("Enable JavaScript and
  cookies") em vez de JSON. A Container App (outro IP/range) não teve este problema
  inicialmente. **Não correr a importação via `npm run bible:import` na Cloud Shell —
  usar sempre o endpoint `POST /biblia/importar/:versao` da API em produção.**

## Estado da importação bíblica

- **Requisito do utilizador (2026-07-11): as versões da Bíblia no site têm de ser
  fiáveis e completas** — texto correto (fonte com licença clara, não um dataset
  qualquer sem verificação) e os 66 livros integralmente importados, não parcial.
  Isto é um critério de aceitação, não um "nice to have" — antes de dar uma versão
  por pronta, confirmar contagem de livros/capítulos/versículos e a proveniência
  do texto.
- **Midvash API (`bible-import.service.ts`) está bloqueada.** Confirmado nos logs
  de produção: a partir de 2026-07-10/11 a Midvash passou a devolver um desafio
  Cloudflare (403 "Just a moment...") logo no primeiro pedido (`/versions/ara`),
  mesmo a partir do Container App (que antes não tinha este problema). Não vale a
  pena repetir o disparo `POST /biblia/importar/ara` sem mais — falha sempre no
  mesmo ponto. Os dados que lá estavam ("ARA", 1 livro "João") eram apenas dados
  de exemplo/seed, nunca uma importação real completa.
- **Nova via, implementada nesta sessão**: `apps/api/src/modules/bible/import/usfx-import.service.ts`
  + endpoint `POST /biblia/importar-dominio-publico` (protegido, admin). Importa a
  tradução de João Ferreira de Almeida em edição de **domínio público** (obras
  anteriores a 1931 são PD), a partir do ficheiro USFX do repositório
  `seven1m/open-bibles` (que documenta a licença de cada versão que disponibiliza —
  ver `por-almeida.usfx.xml`). Um único fetch do ficheiro completo (66 livros,
  1189 capítulos, ~31k versículos), não pedido-a-pedido, o que evita tanto o
  bloqueio Cloudflare como o problema de resiliência por capítulo.
  - Fica gravada como versão `JFA` — propositadamente **não** reutiliza o código
    "ARA", porque ARA é a revisão moderna (1993) com direitos de autor da SBB,
    um texto diferente deste.
  - **CONCLUÍDO e confirmado (2026-07-11)**: deployado (commit `4058b4c`, build ACR
    `cbc`, revisão `biblia-production-api--0000008`) e importação disparada via
    `POST /biblia/importar-dominio-publico`. Confirmado nos logs: **66/66 livros
    importados, zero falhas** (39 AT + 27 NT). Verificado também por amostragem:
    `GET /biblia/JFA/joao/3` devolve 36 versículos, com João 3:16 com o texto
    correto. Cumpre o critério de "fiável e completa" definido acima. Esta é,
    portanto, a **versão de referência atual do site** — a "ARA" antiga (1 livro,
    dados de exemplo) continua na BD mas não deve ser usada/mostrada como está
    (é `isDefault: true` — considerar mudar o default para `JFA` ou remover o
    registo de exemplo).
- **Para versões protegidas por copyright (ARA, NVI, etc.)**: não importar a
  partir de datasets encontrados online sem verificar a licença — API.Bible dá
  acesso a um catálogo grande, mas cada editora define os seus termos, e várias
  versões modernas só permitem consulta em tempo real via API, não guardar o
  texto completo na BD local (que é o que este projeto faz). Se decidido avançar
  com essas versões, tratar da licença formalmente primeiro.
- **ACF (Almeida Corrigida Fiel) pedida pelo utilizador (2026-07-11), mas adiada
  por licenciamento**: é copyright da Sociedade Bíblica Trinitariana do Brasil
  (SBTB), não domínio público — termos da SBTB permitem citar até 1.100
  versículos sem autorização, desde que não constituam um livro completo nem
  50% da obra. Importar os 66 livros completos (exigido pelo critério de
  "completa" acima) requer autorização escrita da SBTB primeiro. Decisão: avançar
  já só com JFA; tratar do ACF/SBTB mais tarde se o utilizador quiser mesmo essa
  versão.

## Referências cruzadas entre versículos (2026-07-11)

- **Dataset**: openbible.info, ~345 mil referências (Treasury of Scripture
  Knowledge + votação da comunidade), licença CC-BY. Download:
  `https://a.openbible.info/data/cross-references.zip` (zip com um `.txt`
  TSV: `From Verse / To Verse / Votes`, notação `Livro.Capítulo.Versículo`,
  intervalos como `Ps.148.4-Ps.148.5`).
- **Arquitetura**: `apps/api/src/modules/bible/import/cross-reference-import.service.ts`
  guarda em `bible_cross_references` por **código canónico de livro**
  (mesmo esquema de `BibleBook.externalId` do import USFX — "GEN", "JOS",
  etc.), sem FK para `bible_verses`. Propositado: qualquer versão nova que
  venha a ser importada com esse esquema de códigos herda automaticamente
  este conjunto de referências, sem reimportar nada. Se uma futura versão
  usar outro esquema de códigos (ex.: id numérico da Midvash, como a "ARA"
  antiga), as referências não resolvem para essa versão — manter o esquema
  de `externalId` USFX consistente em qualquer import futuro.
- **Endpoints**: `POST /biblia/importar-referencias-cruzadas` (admin) dispara
  a importação (idempotente — apaga tudo e reinsere); `GET
  /biblia/:versao/:livro/:capitulo/:versiculo/referencias` (público) devolve
  as referências já resolvidas para nomes/slugs da versão pedida, ordenadas
  por votos.
- **CONCLUÍDO e confirmado (2026-07-11)**: schema aplicado em produção
  (`prisma db push`), API deployada, importação disparada e confirmada —
  **344.799/344.799 gravadas**, sem falhas, em ~2 minutos (usa `createMany`
  em lotes de 5000, não upsert um a um). Verificado com Génesis 1:1 (62
  referências, ex. "Hebreus 11:3" com 271 votos — bate certo com o ficheiro
  fonte).
- **UI concluída e confirmada em produção (2026-07-11, commit `c9883b9`)**:
  botão "Referências" na barra de ações de cada versículo
  (`apps/web/components/VerseReader.tsx`), carrega sob pedido e mostra as
  referências como chips clicáveis. Testado em produção (não em local — a
  API só aceita CORS do domínio de produção): Génesis 1:1 mostra as 62
  referências pela ordem certa de votos, e clicar num chip (ex. "Jó 38:4")
  navega corretamente para esse capítulo.

## Redesign visual da Home (decidido em 2026-08-14, IMPLEMENTADO em 2026-08-14)

**Estado: feito, publicado (`3b8982d`) e confirmado em produção.** Resumo do
que mudou, secção a secção do plano original abaixo:

- `apps/web/tailwind.config.ts`: paleta trocada para os tons petróleo/gold da
  proposta (`sacred-900 #0d2935`, `sacred-700 #113642`, `sacred-600 #1c4d59`,
  `gold-600 #a97a3a`/`gold-500 #c58c43`/`gold-400 #d9a962`, `parchment-50
  #fbfaf7`/`100 #f5f0e8`/`200 #ece3d3`), mantendo os mesmos nomes de token —
  Navbar/Footer não precisaram de alterações. `fontFamily.serif/sans` passam a
  apontar para `var(--font-display)`/`var(--font-sans)`.
- `apps/web/app/layout.tsx`: `Cormorant_Garamond` (display) + `Manrope` (sans)
  via `next/font/google`, `viewport.themeColor` atualizado para `#113642`.
- `apps/web/app/page.tsx`: reescrita completa em Tailwind (sem copiar CSS à
  mão da proposta) — Hero com gradiente radial + CTAs reais (`/biblia`,
  `/registo`); Palavra do Dia ligada a `GET /devocionais/hoje` (usa
  `verseReference`/`verseText` já existentes, sem endpoint novo), com
  fallback "Ainda não há um devocional publicado para hoje." quando vazio;
  grelha de livros com 6 livros curados (Génesis/Salmos/Provérbios/Mateus/
  João/Romanos) filtrados contra `GET /biblia/:versao/livros` real (nunca
  inventados — se um slug não existir, é simplesmente omitido); Estudos
  ligados a `GET /estudos` (3 mais recentes); Plano de leitura ligado a
  `GET /planos-leitura` (primeiro publicado) — **decisão sobre visitante sem
  sessão**: como o token fica em `localStorage` (só no browser) e a home é
  server component, não dá para saber se há sessão no servidor — por isso a
  secção mostra sempre a descrição/duração reais do plano em destaque com CTA
  para `/perfil`, sem barra de progresso inventada (a proposta tinha uma fixa
  em "6%", removida por ser dado falso); Missão com o texto da proposta.
  Todas as secções têm `dark:` e usam `sm:`/`lg:` do Tailwind em vez dos
  breakpoints `900px`/`600px` da proposta.
- Verificado: typecheck limpo; API real ligada (contagens de capítulos
  corretas); estados vazios corretos para estudos/planos/devocional (a BD de
  produção ainda não tem estudos/planos publicados — normal, não é bug);
  claro e escuro confirmados via computed styles; mobile (375px) confirmado.

O utilizador trouxe uma proposta de layout gerada noutra ferramenta (ChatGPT
Sites/vinext) para comparação com a home actual, e decidiu avançar. Contexto e
decisões abaixo — para retomar sem repetir a análise.

**Onde está a proposta (referência de estilo, não faz parte do monorepo):**
`C:\Users\vass_\Claude\Projects\BIBLIA.AO\Biblia-ao-codigo-fonte2\biblia-ao\`
- `app/page.tsx` — composição/marcação das secções (hero, "Palavra do Dia" com
  ilustração CSS, grelha de livros por tom de cor, lista de estudos em fundo
  escuro, cartão de plano de leitura com progresso, secção de missão, footer).
- `app/layout.tsx` — fontes `Cormorant_Garamond` (display) + `Manrope` (sans)
  via `next/font/google`.
- `app/globals.css` — ~15KB de CSS à mão com a paleta e todas as regras das
  secções acima, incluindo breakpoints `900px`/`600px`.

É um scaffold Cloudflare Sites/ChatGPT (`chatgpt-auth.ts`, `.openai/hosting.json`,
`vinext`), sem Tailwind, sem dark mode, sem ligação a nenhuma API — conteúdo
todo mock (livros fixos, data hardcoded `"Terça-feira, 11 de Agosto de 2026"`,
progresso de plano fixo em `6%`) e navegação por âncoras (`#ler`, `#estudos`)
em vez de rotas. **Não copiar ficheiros desta pasta para o monorepo** — usar
só como referência visual e reescrever como componentes Tailwind.

**Decisão do utilizador:** manter 100% da funcionalidade e arquitectura
actuais (rotas reais, `apps/api`, dark mode, Navbar/Footer com os 10 links
reais) e só reconstruir a **home** (`apps/web/app/page.tsx`) com a composição
visual e a **paleta da proposta** (confirmado — adoptar petróleo/navy, não
manter o azul-índigo `sacred` actual).

**Paleta — de → para** (`apps/web/tailwind.config.ts`):
- `sacred-700 #243a70` / `sacred-600 #2f4b91` / `sacred-900 #131f3d` → tons da
  proposta: `--navy #0d2935` / `--ink #162c36` (definir a escala `sacred-*`
  nova a partir destes, mantendo os mesmos nomes de token para não obrigar a
  tocar em todas as classes já usadas em Navbar/Footer/páginas).
- `gold-400 #d8b45f` / `gold-500 #c49a3b` / `gold-600 #a67e28` → aproximar de
  `--gold #c58c43` da proposta.
- `parchment-50/100/200` → aproximar de `--cream #f5f0e8` / `--paper #fbfaf7`.
- Depois de mudar os hex no `tailwind.config.ts`, as classes existentes
  (`sacred-*`, `gold-*`, `parchment-*`) propagam sozinhas — não devia ser
  preciso tocar em Navbar.tsx/Footer.tsx. Confirmar contraste AA (texto sobre
  fundo) em modo claro **e** escuro depois da troca, sobretudo no hero escuro.
- Tipografia: trocar `fontFamily.serif`/`sans` no mesmo ficheiro para usar
  Cormorant Garamond + Manrope via `next/font/google` no
  `apps/web/app/layout.tsx` (seguir o padrão do `layout.tsx` de referência
  acima), em vez do Georgia/system stack actual.

**Plano de implementação sugerido (secção a secção, dados reais em vez de mock):**
1. `tailwind.config.ts` — nova paleta + tipografia (ver acima).
2. Hero — manter CTAs para `/biblia` e `/registo`, aplicar a composição visual
   da proposta (gradiente, glows).
3. "Palavra do Dia" — ligar a um endpoint real de versículo do dia; **confirmar
   se já existe em `apps/api/src/modules/bible`** (não confirmado nesta
   sessão) — se não existir, é preciso criá-lo antes.
4. Grelha de livros — usar dados reais (`GET /biblia/versoes` ou equivalente),
   não os 6 livros hardcoded da proposta.
5. Estudos em destaque — ligar a `apps/api/src/modules/studies`.
6. Plano de leitura — ligar a `apps/api/src/modules/reading-plans` (progresso
   real do utilizador autenticado; decidir o que mostrar a um visitante sem
   sessão — a proposta não previa este caso).
7. Secção de missão/sobre — conteúdo estático, pode aproveitar quase
   directamente o texto da proposta.
8. Adicionar variantes `dark:` a todas as secções novas — a proposta não tem
   modo escuro, o resto do site tem (`darkMode: 'class'` + `ThemeToggle`).
9. Traduzir os breakpoints `900px`/`600px` do CSS de referência para
   `sm:`/`md:`/`lg:` do Tailwind.
10. Não copiar `app/chatgpt-auth.ts` nem `.openai/hosting.json` — específicos
    do scaffold Cloudflare Sites, sem equivalente/necessidade neste stack
    (Next.js + Azure).

## Leitura contínua na Home + copyright no rodapé (2026-08-15)

**Estado: implementado e verificado localmente (dados reais de produção via
`API_URL`), a aguardar `git push` + confirmação em produção.**

- `apps/web/components/Footer.tsx`: rodapé passa a incluir
  "Ministério GCI" na linha de copyright.
- `apps/web/app/page.tsx`: a secção "Plano de leitura" da home deixou de
  depender de haver um `ReadingPlan` publicado na BD (que ainda não existe) e
  passou a mostrar **"Leitura de hoje"** — um capítulo calculado, não
  guardado por dia. Pedido do utilizador: "hoje são 15 de agosto de 2026 e a
  leitura é de Salmos 8; amanhã será 9, depois 10... é uma sequência em loop
  nos capítulos da Bíblia" — ou seja, **não é um plano anual curado de 365
  linhas**, é uma fórmula: capítulo-âncora + dias decorridos, em ciclo pelos
  1189 capítulos do cânone (Génesis 1 → Apocalipse 22 → recomeça em Génesis
  1). Implementado em `getLeituraDoDia()`:
  - Âncora fixa no código: `15/08/2026 = Salmos 8` (verificável, é o dado que
    o utilizador deu).
  - `GET /biblia/:versao/livros` já devolve os 66 livros ordenados por
    `order` (canónico) com `chaptersCount` real — a função soma esses
    capítulos para achar a posição do dia âncora, soma `diasDesdeAncora`,
    aplica módulo ao total de capítulos e percorre a lista para resolver
    (livro, capítulo).
  - `getLivrosDestaque()` passou a devolver `{ versao, todos, destaque }` em
    vez de só os 6 livros curados, para a home ter a lista completa
    disponível a este cálculo sem um pedido extra à API.
  - Testado: hoje mostra "Salmos 8" com link `/biblia/JFA/salmos/8` que abre
    o capítulo real; matemática confirmada a incrementar corretamente
    (ontem=7, amanhã=9) e a transitar corretamente para o livro seguinte ao
    passar do capítulo 150 de Salmos.
  - **Limitação conhecida (aceite pelo utilizador)**: "hoje" usa o relógio do
    servidor (mesmo padrão de `devotionals.service.ts`), não o fuso horário
    de cada leitor — o utilizador perguntou sobre um automatismo por fuso
    local e decidiu que não é necessário agora, só precisa que "leitura de
    hoje, Salmos 8" apareça como lembrete.
- `apps/api/src/modules/reading-plans/`: adicionados `dto/upsert-reading-plan.dto.ts`,
  `dto/upsert-reading-plan-day.dto.ts`, e em `reading-plans.service.ts` +
  `reading-plans.controller.ts` os métodos/rotas `create` (`POST
  /planos-leitura`), `update` (`PATCH /planos-leitura/:id`) e `upsertDay`
  (`PUT /planos-leitura/:id/dias/:dayNumber`), todos `@Roles(...EDITORES)`.
  Não são usados pelo cálculo de "leitura de hoje" acima (que não depende de
  BD) — ficam disponíveis para o padrão diferente de planos autoguiados
  (ex.: "Romanos em 16 dias") que o utilizador pode querer criar mais tarde.

## Pendências (por ordem de prioridade sugerida)

1. ~~Confirmar conclusão da importação bíblica~~ — **FEITO (2026-07-11)**: versão
   `JFA` importada, 66/66 livros, ver "Estado da importação bíblica" acima.
   ~~Decidir se `JFA` passa a `isDefault`~~ — **FEITO (2026-07-11)**: `JFA` marcada
   como `isDefault: true`. Falta ainda decidir se vale a pena apagar o registo
   "ARA" de exemplo (dados parciais/de exemplo) para não confundir.
   - **Nota sobre sessões em paralelo**: este outage de autenticação à BD foi
     trabalhado por **duas sessões de Claude Code em simultâneo** (uma na Cloud
     Shell, outra local) sem coordenação — cada uma mudou a password do Postgres
     de forma independente, o que atrasou o diagnóstico. Descrição completa e causa
     raiz real (não era só a password estar dessincronizada — era um env var
     literal a ignorar o secret) na secção "Incidente resolvido: outage de
     autenticação à BD" acima. **Lição**: não correr duas sessões a mexer na mesma
     infraestrutura de produção ao mesmo tempo.
2. ~~`apps/web/app/biblia/page.tsx` hardcoded para "ARA"~~ — **FEITO (2026-07-11,
   commit `8256207`)**: a página estava fixa no código "ARA" (por isso continuava
   a mostrar só João mesmo depois de a JFA ser importada e marcada `isDefault`).
   Corrigido para buscar a versão via `GET /biblia/versoes` e usar a que tiver
   `isDefault: true`. Deploy automático via `deploy-web` (GitHub Actions) — confirmar
   visualmente em produção após alguns minutos.
3. CI (`ci.yml`) falha (API exit 127, Web exit 1) — nunca investigado, não bloqueante.
4. Job `deploy-api` do GitHub Actions falha por falta de OIDC (client-id/tenant-id não
   configurados). Configurar federated credentials + secrets
   (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`) para automatizar o
   deploy da API em vez do ciclo manual acima. (Nota: já não é preciso Cloud Shell
   para o ciclo manual, `az` CLI está instalado localmente — ver secção de deploy.)
5. Deploy de um modelo Azure OpenAI real (ex. `gpt-4o-mini`) para a funcionalidade
   "Pergunte à Bíblia" (RAG) funcionar — ainda não feito.
6. Configurar `AZURE_STORAGE_ACCOUNT_NAME` / `AZURE_STORAGE_ACCOUNT_KEY` na Container
   App para o upload de recursos funcionar contra o Azure Blob real.
7. Domínio próprio (biblia.ao) — não iniciado.
8. Secções placeholder em `/perfil` (Favoritos, Notas, Histórico, Planos, Perguntas à
   IA) marcadas "Em breve" — não construídas ainda.
9. Rodar o `acr-password` (apareceu em texto claro num ecrã partilhado nesta sessão):
   `az acr credential renew --name acrbibliaproductionuwvxyigge57t4 --password-name password`
10. **Mudar a password de admin (`admin@biblia.ao`) em `/perfil/definicoes`** — apareceu
    em texto claro num screenshot partilhado nesta sessão (2026-07-11), tal como o
    acr-password no item anterior.
11. ACF (Almeida Corrigida Fiel) — pedido pelo utilizador, adiado por licenciamento;
    ver "Estado da importação bíblica" acima. Se decidido avançar, contactar a SBTB
    para autorização de uso completo antes de importar.
12. ~~UI no frontend para mostrar referências cruzadas~~ — **FEITO (2026-07-11)**,
    ver secção "Referências cruzadas" acima.
13. ~~Redesign visual da home~~ — **FEITO (2026-08-14)**, ver secção "Redesign
    visual da Home" acima. Falta só `git push` + confirmar em produção.
