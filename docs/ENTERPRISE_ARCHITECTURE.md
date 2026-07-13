> "Porque dele, por meio dele e para ele são todas as coisas. A ele seja a
> glória eternamente. Amém." — Romanos 11:36

---

# Bíblia.ao Enterprise Architecture

Arquitetura Corporativa da Plataforma Digital para Divulgação do Evangelho

Versão 1.0 (esqueleto) · Documento Oficial de Arquitetura

Ler primeiro `CONSTITUICAO.md` — este documento é a consequência técnica
daquele, não o ponto de partida. Toda decisão aqui descrita deve poder
justificar-se pelos 12 Princípios.

Estado atual: **esqueleto/índice estruturado**, a preencher secção a
secção até à profundidade de um Architecture Center (~80-150 páginas). O
que já está implementado no scaffold real está documentado com detalhe em
`ARQUITETURA.md`, `MODELO_DADOS.md` e `API.md` — este documento eleva essa
base ao nível de arquitetura corporativa e define o alvo (target state),
não apenas o estado atual (as-is).

---

## Índice

1. Visão da Plataforma
2. Arquitetura Lógica
3. Arquitetura Física
4. Arquitetura Azure (Target State)
5. Modelo de Identidade
6. Modelo de Dados
7. Modelo de Segurança
8. Modelo de APIs
9. Bible Provider Integration Layer
10. IA Bíblica (RAG)
11. DevOps & CI/CD
12. Disaster Recovery
13. Escalabilidade
14. Roadmap até à v5.0
15. Registo de Decisões de Arquitetura (ADRs)

---

## 1. Visão da Plataforma

O Bíblia.ao deixa de ser pensado como um site e passa a ser desenhado como
um **ecossistema**:

```
                  Biblia.ao
                       │
        ┌──────────────┼──────────────┐
      Bíblia        Academia      Comunidade
        │               │              │
   Estudos        Cursos MCT     Igrejas
        │               │              │
 Devocionais      Certificados   Eventos
        │               │              │
 Biblioteca      API Pública      IA Bíblica
```

*[A preencher: descrição de cada pilar (Bíblia, Academia, Comunidade),
público-alvo de cada um, e como se relacionam entre si.]*

---

## 2. Arquitetura Lógica

### Antes (estado atual do scaffold)

```
Frontend
    │
Backend
    │
Autenticação
```

A identidade é tratada como uma funcionalidade do backend — `apps/api`
gere JWT, hashing de password (argon2) e RBAC internamente. Ver
`ARQUITETURA.md#seguranca-e-rbac` para o estado atual implementado.

### Agora (target state)

```
Frontend
    │
Azure Front Door
    │
Microsoft Entra External ID
    │
Azure API Management
    │
Serviços
```

A identidade passa a ser um **serviço da plataforma**, não uma
funcionalidade do backend — mudança de filosofia arquitetónica, não só de
tecnologia. Consequência direta do Princípio 8 (a segurança é uma forma de
cuidar das pessoas) e do Princípio 9 (construir para as próximas
gerações).

*[A preencher: diagrama C4 (Contexto → Contentores → Componentes),
racional de cada camada, o que motiva cada escolha.]*

---

## 3. Arquitetura Física

*[A preencher: landing zone Azure, regiões (South Africa North como
região primária de recursos — ver decisão histórica em `HANDOFF.md` —
West Europe usado pontualmente por disponibilidade de serviço), rede
virtual, subnets, private endpoints, topologia hub-spoke se aplicável.]*

---

## 4. Arquitetura Azure (Target State)

Diagrama de referência oficial (ver `Arquitectura Biblia.ao.png`, pasta
`Arquitectura/`) — 9 camadas, dos canais de utilizador até DevOps:

**1. Camada de Experiência (Canais)** — Website (Portal Web), PWA, App
Mobile (Android/iOS), Painel Administrativo (CMS), Portal de Líderes
(gestão de igrejas), Portal de Desenvolvedores (documentação/APIs).
Utilizadores: Visitantes, Cristãos, Líderes, Pastores, Crianças,
Administradores.

**2. Camada de Edge e Segurança** — Azure DNS (gestão de domínios) → Azure
Front Door (distribuição global) → WAF (Web Application Firewall) → Azure
CDN (entrega de conteúdo) → proteção DDoS.

**3. Camada de Identidade e Acesso** — dois planos de identidade
distintos: Microsoft Entra External ID para utilizadores externos
(registo/login por e-mail ou social, gestão de perfis, MFA opcional,
emissão de tokens OAuth 2.0/OIDC); Microsoft Entra ID (Workload) para
identidade administrativa (administradores e equipas, MFA obrigatório,
Conditional Access, Privileged Identity Management). Ver também Secção 5
(Modelo de Identidade) para a separação Identidade vs. Perfil.

**4. Camada de Gestão de APIs** — Azure API Management como gateway
único: validação de tokens (JWT/Entra), rate limiting e throttling,
versionamento de APIs, portal de desenvolvedores, monitorização de
consumo. Expõe APIs Públicas e APIs Privadas distintas.

**5. Camada de Serviços de Domínio** — os microsserviços/módulos de
negócio: Bible Content Service (versões, livros, capítulos, versículos,
idiomas, licenças, importação/atualização — ver Secção 9), Search Service
(pesquisa por palavra, semântica, referências cruzadas), User Profile
Service (perfil, preferências, idioma/versão, privacidade), Reading
Service (planos de leitura, progresso, notas/destaques, histórico),
Content Management Service (estudos, devocionais, artigos/blog, cursos,
vídeos/áudios), Church & Events Service (igrejas, líderes, eventos,
localização, solicitações), Community Service (perguntas e respostas,
comentários, grupos, moderação, reputação), Notification Service (e-mail,
push, alertas, lembretes), AI Biblical Assistant (perguntas bíblicas,
respostas com IA, referências, resumo de capítulos, comparação de
textos). Corresponde 1:1 aos 12 módulos principais do frontend (ver lista
completa no diagrama).

**6. Camada de Integração Bíblica** — o Bible Provider Integration Layer
(Secção 9 abaixo), com adaptadores para API.Bible, Digital Bible Library,
Open.Bible, eBible, ficheiros USFM/OSIS e repositório próprio, mais
normalização de dados, controlo de licenças, regras de uso e atualização
de conteúdo.

**7. Camada de Dados e Armazenamento** — Azure Database for PostgreSQL
(dados transacionais: utilizadores, perfis, planos, progresso, conteúdo,
igrejas, eventos, permissões/licenças/metadados), Azure Blob Storage
(PDFs, áudios, vídeos, imagens, ficheiros USFM/OSIS, backups e
importações), Azure AI Search (índice de pesquisa: versículos, estudos,
artigos, pesquisa semântica, sugestões/autocomplete), Azure Cache for
Redis (conteúdo popular, sessões, resultados de pesquisa, limitação de
taxa).

**8. Camada de Eventos e Processamento Assíncrono** — Azure Service Bus
(filas, tópicos, pub/sub), Azure Event Grid (eventos de domínio,
integração entre serviços, notificações), Azure Functions (jobs
agendados, processamento de eventos, tarefas em segundo plano), Logic
Apps (fluxos de trabalho, integrações externas, aprovações).

**9. Camada de Segurança, Monitorização e DevOps** — Azure Key Vault
(segredos e certificados), Managed Identity (identidades geridas), Private
Endpoints (acesso privado), Defender for Cloud (proteção contínua), Azure
Monitor (logs e métricas), Application Insights (observabilidade), Backup
& Recovery (backups automáticos), CI/CD via GitHub Actions/Azure DevOps
(deploy contínuo).

Notas transversais do diagrama: conformidade GDPR/LGPD, instância Azure
na região West Europe, e os atributos-alvo de escalabilidade, alta
disponibilidade, segurança e performance aplicam-se a todas as camadas.

### Estado atual vs. alvo

Estado atual real (produção, ver `HANDOFF.md` para detalhe operacional):
Container Apps (API) + Static Web Apps (frontend) + PostgreSQL Flexible
Server + Container Registry + Bicep, sem ainda Front Door, WAF, APIM,
Entra External ID, Service Bus, AI Search nem Application Insights
configurados. As 9 camadas acima definem o alvo — a lista de pendências em
`HANDOFF.md` é o caminho incremental até aqui.

*[A preencher: mapeamento explícito estado-atual → estado-alvo por
camada, com justificação de prioridade de cada migração; detalhe de cada
serviço de domínio da Camada 5 como sub-secção própria.]*

---

## 5. Modelo de Identidade

Separação intencional entre **Identidade** e **Perfil do Utilizador** —
são coisas completamente diferentes e nunca se devem misturar segurança
com dados de aplicação.

### Identidade (Microsoft Entra External ID)

- Email
- Password
- MFA
- OAuth / OIDC
- Tokens
- Roles

### Perfil do Utilizador (PostgreSQL)

- Nome
- Igreja
- Versão favorita
- Plano de leitura
- Notas
- Favoritos
- Histórico
- Idioma
- Fotografia

*[A preencher: fluxo de autenticação completo, mapeamento entre `sub` do
token Entra e `User.id` no Postgres, estratégia de migração do RBAC atual
(`UserRole` enum em `prisma/schema.prisma`) para claims/roles do Entra
External ID, plano de transição sem downtime.]*

---

## 6. Modelo de Dados

*[A preencher: apontar para `MODELO_DADOS.md` como base as-is, e
documentar aqui apenas as mudanças de arquitetura corporativa — ex.:
remoção de campos de credenciais do modelo `User` após migração para
Entra, novo modelo de "Perfil" separado.]*

---

## 7. Modelo de Segurança

*[A preencher: WAF, Key Vault, rotação de segredos, gestão de secrets da
Container App (ver incidente documentado em `HANDOFF.md` — secret
`database-url` desatualizado após rotação de password, lição aprendida:
secretRef só é resolvido na criação de revisão, não em restart),
Application Insights / Monitor, política de resposta a incidentes.]*

---

## 8. Modelo de APIs

*[A preencher: apontar para `API.md` como referência de endpoints
existentes; documentar aqui o plano de introdução do Azure API Management
como camada de gestão/gateway sobre a API NestJS atual — rate limiting,
versionamento, API pública para parceiros (Princípio 6: colaboração).]*

---

## 9. Bible Provider Integration Layer

Camada obrigatória: o resto da aplicação nunca deve saber de onde vem o
texto bíblico — só chama `BibleService.getVerse()` (ou equivalente). Quem
resolve a origem é esta camada.

Fontes já avaliadas ou integradas (ver `HANDOFF.md` para o histórico
completo de decisões e o porquê de cada mudança):

- **API.Bible** — plano original, não avançado.
- **Midvash API** — integrada, depois abandonada por bloqueio ativo da
  Cloudflare (ver `HANDOFF.md`).
- **USFX / `seven1m/open-bibles`** — fonte atual em produção. Importação
  de João Ferreira de Almeida, edição de **domínio público**, versão
  `JFA`, 66/66 livros confirmados.
- Fontes futuras possíveis: Digital Bible Library, OpenBible, eBible,
  formatos USFM/OSIS/XML/JSON, base própria.

Regra de licenciamento (decisão já tomada e registada em `HANDOFF.md`):
versões protegidas por copyright (ARA, NVI, ACF, etc.) só podem ser
importadas na íntegra com autorização escrita da editora/sociedade
bíblica detentora dos direitos. Nunca importar um dataset de proveniência
não verificada.

*[A preencher: interface formal `BibleProvider`, estratégia de cache,
plano para permitir múltiplos providers ativos em simultâneo.]*

---

## 10. IA Bíblica (RAG)

Princípio 10: a IA serve a verdade, nunca é autoridade espiritual.

*[A preencher: arquitetura RAG (Azure AI Search + Azure OpenAI),
estratégia de curadoria de conteúdo-fonte (só conteúdo autorizado),
guardrails para impedir a IA de responder fora do corpus bíblico
aprovado, ver pendência #5 em `HANDOFF.md` — deploy do modelo ainda não
feito.]*

---

## 11. DevOps & CI/CD

*[A preencher: estado atual documentado em detalhe operacional em
`HANDOFF.md` (ciclo manual via `az acr build` + `az containerapp update`,
job `deploy-api` do GitHub Actions ainda a falhar por falta de OIDC — ver
pendência #4). Aqui documentar o alvo: pipeline totalmente automatizado,
ambientes (dev/staging/produção), estratégia de rollback.]*

---

## 12. Disaster Recovery

*[A preencher: RPO/RTO alvo, estratégia de backup do PostgreSQL Flexible
Server, plano de failover entre regiões.]*

---

## 13. Escalabilidade

*[A preencher: scale rules da Container App (atual: min 1 / max 5
réplicas, ver `HANDOFF.md`), estratégia de cache, CDN via Front Door.]*

---

## 14. Roadmap até à v5.0

*[A preencher: marcos por versão — v1 (fundação atual), v2 (identidade
Entra + APIM), v3 (IA/RAG em produção), v4 (Academia + Comunidade), v5
(API pública para parceiros/ecossistema).]*

---

## 15. Registo de Decisões de Arquitetura (ADRs)

Lista viva de decisões relevantes já tomadas, extraídas do histórico
operacional em `HANDOFF.md`:

- ADR-001: Identidade passa a ser tratada como serviço de plataforma
  (Entra External ID), não como funcionalidade do backend.
- ADR-002: Separação entre Identidade (Entra) e Perfil do Utilizador
  (PostgreSQL).
- ADR-003: Bible Provider Integration Layer como camada obrigatória,
  independentemente da fonte de texto bíblico.
- ADR-004: Abandono da Midvash API como fonte primária, por bloqueio
  ativo de Cloudflare a partir de infraestrutura Azure.
- ADR-005: JFA (domínio público) como versão de referência atual, até
  obtenção de autorização formal para versões com copyright (ARA, ACF).

*[Formato completo de ADR a definir — contexto, decisão, consequências,
alternativas consideradas.]*
