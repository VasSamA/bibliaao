# Biblia.ao — Handoff para Claude Code

Última atualização: 2026-07-11

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
