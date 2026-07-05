# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é o AutoGraph

Plataforma de gestão para gráficas: um chatbot de IA (LangChain + RAG) atende clientes via WhatsApp Business Cloud API, coleta especificações do pedido através de uma FSM de conversa, calcula orçamento determinístico, cria Ordens de Serviço (OS) e notifica o gerente em tempo real (Socket.io + FCM). O gerente e o cliente usam um app Flutter (dashboard/kanban para o gerente, rastreio de OS para o cliente).

Monorepo: `backend/` (Node.js + TypeScript + Express + Prisma) e `frontend/` (Flutter). Documentação e código usam nomes em português (PT-BR).

## Comandos (backend — rodar de `backend/`)

```powershell
# Infra: Postgres + pgvector (da raiz do repo)
docker-compose up -d db

# Setup
npm install
cp .env.example .env          # preencher GOOGLE_API_KEY (obrigatória p/ embeddings) e GROQ_API_KEY
npx prisma migrate dev
npx prisma db seed            # usuários mock (gerente + cliente)
npm run seed:knowledge        # base vetorial do RAG

# Desenvolvimento
npm run dev                   # ts-node-dev com respawn, porta 3000

# Testes
npm test                      # jest, exclui src/tests/fluxos
npm run test:fluxos           # testes E2E de fluxos de conversa (precisam de DB + chaves LLM)
npx jest src/tests/fluxos/fluxo1.test.ts   # um único fluxo
npm run test:rag              # RAG (busca vetorial + resposta)
npm run test:guardrails       # cenários adversariais (IA não pode dar preço)
npm run test:entities         # extração de entidades do pedido
npm run test:e2e              # fluxo completo webhook → IA → resposta

# Banco
npx prisma studio             # GUI em localhost:5555
```

## Comandos (frontend — rodar de `frontend/`)

```powershell
flutter pub get
flutter run -d chrome         # web
flutter analyze               # obrigatório após alterações significativas; corrigir warnings
```

## Arquitetura do backend

Camadas rígidas **Controller → Service → Repository** (regra do projeto: lógica de negócio e IA só em Services; acesso a banco só em Repositories).

Fluxo principal (mensagem do WhatsApp):
1. `POST /webhook` (`routes/webhook.routes.ts`) recebe o payload da Meta Cloud API. `GET /webhook` faz a validação do `WEBHOOK_VERIFY_TOKEN`.
2. `services/webhook.service.ts` identifica/cria o cliente (`Usuario`), persiste a mensagem e delega à FSM — **a menos que** `Usuario.atendimentoHumano = true` (takeover humano silencia a IA).
3. **FSM de conversa** em `src/fsm/`: `states.ts` define `ConversationState` (BOAS_VINDAS → COLETAR_ESPECIFICACOES → CALCULAR_ORCAMENTO → … → GERAR_OS) e o `ConversationContext` persistido em `SessaoAtendimento.contexto` (JSON). `state-router.ts` roteia para handlers em `src/handlers/`; `transition.service.ts` gerencia transições; `intent.service.ts` classifica intenção.
4. **IA**: `services/llm-factory.ts` escolhe o provider via `LLM_PROVIDER` (`groq` default ou `gemini`); embeddings são **sempre** Gemini. Chaves suportam round-robin com múltiplos valores separados por vírgula (contorna rate limit do tier free). `rag.service.ts` consulta a base vetorial (pgvector) — os **guardrails** proíbem a IA de inventar preços.
5. **Preço**: determinístico via `adapters/pricing.adapter.ts` (não vem do LLM).
6. Se `ADMIN_APPROVAL_REQUIRED=true` (default), a FSM pausa em `AGUARDAR_APROVACAO_ADMIN` até o gerente aprovar a proposta.
7. Resposta sai por `whatsapp.service.ts` — com `USE_MOCK_WHATSAPP=true` apenas loga (`[MOCK WPP] ...`), sem chamar a Meta.

Tempo real: `server.ts` sobe Express + Socket.io no mesmo servidor HTTP. Mensagens do painel admin chegam via socket com `senderId === 'admin'`, são reenviadas ao WhatsApp e ativam o takeover (seta `atendimentoHumano`, salva `estadoSalvoTakeover` no contexto da sessão para restaurar a FSM depois). `io` é exportado de `server.ts` e usado pelos services para emitir eventos. Push notifications via Firebase Admin (FCM). `cron.service.ts` inicia jobs no boot.

Prisma: schema em `backend/prisma/schema.prisma`; usa `@prisma/adapter-pg`. Entidades centrais: `Usuario`, `OrdensDeServico` (status: CRIADA, AGUARDANDO_ORCAMENTO, EM_PRODUCAO, PRONTA_PARA_RETIRADA, ENTREGUE, CANCELADA), `Mensagens`, `SessaoAtendimento`, `DocumentosConhecimento` (chunks vetoriais).

## Arquitetura do frontend

Flutter com estrutura por feature em `lib/features/` (`auth/`, `os_cliente/`, `admin_grafica/`, `admin_chat/`) e `lib/core/` (temas, rotas, services, cliente HTTP). Tempo real via `socket_io_client`; push via `firebase_messaging`. Regra do projeto: cores/estilos só via `ThemeData` — proibido hardcode de cores em widgets.

## Testes E2E de fluxos (`src/tests/fluxos/`)

- Usam `helpers.ts` (setup compartilhado) e `cleanupUser` para isolar dados entre testes.
- Simulam payloads reais do webhook com mensagens realistas de cliente; `USE_MOCK_WHATSAPP=true` evita chamadas reais à Meta.
- `helpers.ts` força `ADMIN_APPROVAL_REQUIRED=false` para preservar o fluxo de 1 turno; fluxo21 testa o caminho com aprovação.
- Dependem de Postgres rodando e de chaves LLM válidas no `.env` — por isso ficam fora do `npm test` padrão.

## Deploy / infra

- `docker-compose.yml` (raiz): serviço `db` (pgvector/pgvector:pg15) e `app` (build do `backend/Dockerfile`, multi-stage node:20-slim).
- `backend/render.yaml`: blueprint do Render (web service Docker + Postgres, plano free). Produção usa `npm run start-prisma` (migrate deploy + seed + node dist).
- `.env` é carregado manualmente em `server.ts` via leitura física do arquivo (não confie apenas em `dotenv.config()`).

## Regras do projeto (de AGENTE.md)

- Nunca inventar chaves de API, connection strings ou variáveis de ambiente — se não estiver no `.env`/documentação, perguntar ao usuário.
- Trabalho no frontend fica restrito a `frontend/`; backend a `backend/`.
- Comandos irreversíveis (git push, migrações de banco, deleções) exigem confirmação explícita.
- Ao adicionar dependências, usar apenas versões estáveis de bibliotecas confiáveis.
