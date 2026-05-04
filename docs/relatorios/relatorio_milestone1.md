# 📋 Relatório Final — Milestone 1: Fundação e Conectividade

> **Projeto:** AutoGraph — Gestão Gráfica Inteligente  
> **Data de Conclusão:** 04/05/2026  
> **Branch:** `feature/finalizando_milestone1`

---

## 1. O que foi entregue

### 1.1 Infraestrutura (Cards 1–3)

| Entrega | Detalhes |
|---------|----------|
| **Docker Compose** | PostgreSQL (pgvector/pg15) + Node.js, rede interna `autograph_net`, volume persistente |
| **Dockerfile** | Node 20, hot-reload via `ts-node-dev` |
| **Banco de Dados** | Prisma ORM code-first, 4 tabelas + 3 enums, migration aplicada, seed com dados mock |
| **Backend Node.js** | Express + TypeScript, arquitetura Controller→Service→Repository |
| **Variáveis de ambiente** | `.env` + `.env.example` configurados, `.gitignore` protegendo segredos |

### 1.2 Tabelas Criadas (Prisma Schema)

```
┌─────────────────────┐     ┌──────────────────────┐
│      Usuario         │     │   OrdensDeServico     │
├─────────────────────┤     ├──────────────────────┤
│ id         UUID (PK) │◄───┤ clienteId     FK      │
│ nome       String    │     │ status   StatusOS     │
│ email      String?   │     │ especificacoes Json   │
│ telefone   String    │     │ criadoEm   DateTime   │
│ senha      String?   │     │ atualizadoEm DateTime │
│ role       Role      │     └──────────────────────┘
│ fcmToken   String?   │
│ criadoEm   DateTime  │     ┌──────────────────────┐
│ atualizadoEm DateTime│     │     Mensagens          │
└─────────────────────┘     ├──────────────────────┤
         ▲                   │ id         UUID (PK)  │
         │                   │ usuarioId  FK         │
         └───────────────────┤ ordemId    FK?        │
                             │ origem  OrigemMensagem│
                             │ payload    Json       │
                             │ criadoEm   DateTime   │
                             └──────────────────────┘

┌────────────────────────────┐
│   DocumentosConhecimento    │  ← preparado para RAG (Milestone 2)
├────────────────────────────┤
│ id        UUID (PK)        │
│ conteudo  String           │
│ vetor     vector?          │
│ criadoEm  DateTime         │
└────────────────────────────┘
```

**Enums:** `Role` (CLIENTE, GERENTE) · `StatusOS` (CRIADA, EM_PRODUCAO, PRONTA_PARA_RETIRADA, ENTREGUE, CANCELADA) · `OrigemMensagem` (CLIENTE, BOT, GERENTE)

### 1.3 Webhook do WhatsApp (Cards 4v2–8)

| Endpoint | Função | Status |
|----------|--------|--------|
| `GET /webhook` | Validação de handshake com a Meta | ✅ |
| `POST /webhook` | Recepção e processamento de mensagens | ✅ |

**Pipeline completo implementado:**

```
Mensagem WhatsApp (ou Mock)
       │
       ▼
  POST /webhook
       │
       ▼
 WebhookController.receive()
   ├─ Responde 200 OK imediatamente
   └─ parseWhatsAppPayload() extrai dados
       │
       ▼
 WebhookService.processIncomingMessage()
   ├─ 1. ClienteRepository.findByPhone()
   │      └─ Se não existe → ClienteRepository.create()
   ├─ 2. MensagemRepository.create() → salva no banco
   └─ 3. WhatsAppService.sendMessage() → echo response
```

### 1.4 Frontend Flutter (Cards 9–10)

| Entrega | Detalhes |
|---------|----------|
| **Projeto base** | Flutter limpo, sem counter app, Material3 |
| **Tema centralizado** | `AppTheme` com light/dark mode via `AppColors` |
| **Rotas** | `/login`, `/cliente/historico`, `/admin/dashboard` + tela 404 |
| **Telas placeholder** | `LoginScreen` (com botões de navegação), `ClientHistoryScreen`, `AdminDashboardScreen` |
| **Estrutura de features** | `auth/`, `os_cliente/`, `admin_grafica/` — pronta para Milestone 3 |

### 1.5 Arquitetura Final do Backend

```
backend/src/
├── config/
│   └── prisma.ts              ← Singleton PrismaClient
├── controllers/
│   └── webhook.controller.ts  ← GET (validate) + POST (receive)
├── routes/
│   └── webhook.routes.ts      ← Roteamento centralizado
├── services/
│   ├── webhook.service.ts     ← Orquestração: cadastro + salvamento + echo
│   └── whatsapp.service.ts    ← Envio de mensagem (mock ou real)
├── repositories/
│   ├── cliente.repository.ts  ← CRUD de usuários
│   └── mensagem.repository.ts ← Persistência de mensagens
├── utils/
│   └── whatsapp.parser.ts     ← Parse isolado do payload da Meta
├── models/                    ← (vazio — Prisma gera tipos automaticamente)
└── server.ts                  ← Entrypoint Express
```

---

## 2. Como Testar a Milestone 1

### 2.1 Pré-requisitos

1. **Docker Desktop** instalado e rodando
2. **Node.js ≥ 20** instalado
3. **Extensão REST Client** no VS Code (para `.http` files) — ou **Postman/curl**

### 2.2 Subindo o ambiente

```bash
# 1. Na raiz do projeto, subir o banco de dados
docker-compose up -d db

# 2. Verificar que o container subiu
docker ps
# Esperado: container "autograph_db" rodando na porta 5432
```

```bash
# 3. Entrar na pasta do backend
cd backend

# 4. Instalar dependências (se ainda não fez)
npm install

# 5. Gerar o Prisma Client
npx prisma generate

# 6. Aplicar a migration no banco
npx prisma migrate dev

# 7. Popular o banco com dados iniciais
npx prisma db seed

# 8. Iniciar o servidor
npm run dev
# Esperado: "Server is running on port 3000"
```

### 2.3 Teste 1 — Health Check

**Requisição:**
```
GET http://localhost:3000/
```

**Resultado esperado:**
```json
{ "message": "Hello World from AutoGraph API!" }
```
**Status:** `200 OK`

---

### 2.4 Teste 2 — Validação do Webhook (GET) — Card 5

**Requisição com token CORRETO:**
```
GET http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=dev_token_123&hub.challenge=1158201444
```

**Resultado esperado:**
- **Status:** `200 OK`
- **Body:** `1158201444` (o mesmo valor do `hub.challenge`)
- **Console:** `✅ Webhook Validado com Sucesso!`

**Requisição com token INCORRETO:**
```
GET http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=token_errado&hub.challenge=1158201444
```

**Resultado esperado:**
- **Status:** `403 Forbidden`
- **Console:** `❌ Falha na validação: Token incorreto.`

---

### 2.5 Teste 3 — Recepção de Mensagem (POST) — Cards 6, 7 e 8

**Requisição (usando o arquivo `simulate_webhook.http` ou manualmente):**
```
POST http://localhost:3000/webhook
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1234567890_BUSINESS_ACCOUNT_ID",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511900000000",
              "phone_number_id": "123456123_PHONE_ID"
            },
            "contacts": [
              {
                "profile": {
                  "name": "João da Silva (Cliente Mock)"
                },
                "wa_id": "5511999998888"
              }
            ],
            "messages": [
              {
                "from": "5511999998888",
                "id": "wamid.HBgLMTY1MD...",
                "timestamp": "1665476043",
                "text": {
                  "body": "Olá, gostaria de imprimir 1000 cartões de visita."
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

**Resultado esperado:**

| O que observar | Resultado esperado |
|---|---|
| **Status HTTP** | `200 OK` (imediato) |
| **Console log 1** | `📩 Mensagem de João da Silva (Cliente Mock) (5511999998888): Olá, gostaria de imprimir 1000 cartões de visita.` |
| **Console log 2** | `🆕 Novo cliente detectado: João da Silva (Cliente Mock) (5511999998888)` *(só na primeira vez)* |
| **Console log 3** | `💾 Mensagem salva no banco para o cliente João da Silva (Cliente Mock)` |
| **Console log 4** | `[MOCK WPP] Mensagem enviada para 5511999998888: Sua mensagem foi recebida e registrada! Em breve nossa inteligência artificial responderá.` |

### 2.6 Teste 4 — Verificação no Banco de Dados

Após enviar o POST acima, verificar que os dados foram persistidos:

```bash
npx prisma studio
# Abre o Prisma Studio no navegador (http://localhost:5555)
```

**Verificar na tabela `Usuario`:**
- Deve existir um novo registro com `telefone: "5511999998888"`, `nome: "João da Silva (Cliente Mock)"`, `role: CLIENTE`

**Verificar na tabela `Mensagens`:**
- Deve existir um registro vinculado ao usuário acima, com `origem: CLIENTE` e o `payload` contendo o JSON bruto da mensagem

### 2.7 Teste 5 — Idempotência de Cliente

Envie o **mesmo POST duas vezes**. Na segunda vez:

| O que observar | Resultado esperado |
|---|---|
| Console | **NÃO** deve mostrar `🆕 Novo cliente detectado` |
| Banco `Usuario` | Deve ter **apenas 1** registro com telefone `5511999998888` |
| Banco `Mensagens` | Deve ter **2** registros (uma para cada mensagem) |

### 2.8 Teste 6 — Flutter

```bash
cd frontend
flutter run -d chrome   # ou -d android / -d ios
```

**Resultado esperado:**
1. App abre na tela de **Login** (`/login`)
2. Clicar **"Entrar como Cliente"** → navega para tela **"Histórico do Cliente"**
3. Voltar e clicar **"Entrar como Admin"** → navega para tela **"Dashboard do Administrador"**
4. Ambas as telas mostram placeholder text com título na AppBar
5. Temas light/dark funcionam conforme configuração do sistema

---

## 3. Transição para a Milestone 2: O Cérebro (IA e RAG)

### 3.1 Objetivo da Milestone 2

Implementar a inteligência do negócio: o LangChain como motor de IA usando RAG para ler regras/preços da gráfica, atender clientes e gerar Ordens de Serviço automaticamente.

### 3.2 Entregáveis (do milestones.md)

- [ ] Base de Conhecimento (Vector DB) alimentada com tabela de preços, gramaturas e prazos
- [ ] LangChain rodando dentro do Node.js, acionado após recebimento da mensagem
- [ ] Bot RAG respondendo dúvidas complexas com precisão (zero alucinações de preço)
- [ ] Pipeline de Extração: IA capta entidades (Tamanho, Cor, Quantidade, Arquivo) e cadastra a OS no PostgreSQL

### 3.3 O que já está preparado pela Milestone 1

| Fundação | Como será usada na MS2 |
|----------|----------------------|
| **Tabela `DocumentosConhecimento`** com campo `vetor` | Armazenará os embeddings dos catálogos de preços/regras da gráfica |
| **`pgvector` já habilitado** no Docker e Prisma | Pronto para queries de similaridade vetorial |
| **`WebhookService.processIncomingMessage()`** | Ponto de inserção da IA — após salvar a mensagem, chamar o LangChain em vez do echo |
| **`WhatsAppService.sendMessage()`** | Já preparado para enviar a resposta da IA de volta ao cliente |
| **Tabela `OrdensDeServico`** com `especificacoes: Json` | Receberá os dados extraídos pela IA (tamanho, cor, quantidade, etc.) |
| **Mock environment** (`USE_MOCK_WHATSAPP=true`) | Permite testar toda a pipeline de IA localmente |

### 3.4 Cards sugeridos para a Milestone 2

| # | Título | Descrição | Depende de |
|---|--------|-----------|------------|
| 11 | **Setup LangChain no Node.js** | Instalar `langchain`, `@langchain/openai`, configurar LLM provider, criar `AiService` base | — |
| 12 | **Alimentar Base de Conhecimento** | Criar script para ler catálogos (PDF/JSON) da gráfica, gerar embeddings e popular `DocumentosConhecimento` via pgvector | Card 11 |
| 13 | **Implementar RAG Chain** | Criar a chain de Retrieval-Augmented Generation que consulta o vector DB para responder perguntas | Card 12 |
| 14 | **Integrar IA no fluxo de mensagens** | Substituir a resposta "echo" no `WebhookService` pela resposta do LangChain RAG | Card 13 |
| 15 | **Pipeline de Extração de Entidades** | Criar structured output chain para extrair Tamanho, Cor, Quantidade, Tipo de Papel da conversa | Card 14 |
| 16 | **Criação automática de OS** | Quando a IA extrair todas as entidades necessárias, criar registro em `OrdensDeServico` | Card 15 |
| 17 | **Gerenciamento de Contexto de Conversa** | Implementar memória de conversação (histórico) para que a IA mantenha contexto entre mensagens | Card 14 |
| 18 | **Guardrails e Validação de Preços** | Garantir que a IA nunca alucine preços — validar respostas contra a tabela de preços real | Card 13 |

### 3.5 Ponto de integração principal

O ponto exato onde a IA será plugada é o `WebhookService`:

```typescript
// services/webhook.service.ts — MILESTONE 2
async processIncomingMessage(messageData: WhatsAppMessageData): Promise<void> {
  // ... cadastro de cliente e salvamento da mensagem (já implementado)

  // MILESTONE 1 (atual): Echo simples
  // await whatsappService.sendMessage(from, 'Sua mensagem foi recebida...');

  // MILESTONE 2 (futuro): Substituir pelo LangChain
  // const aiResponse = await aiService.processWithRAG(messageData.text, cliente.id);
  // await whatsappService.sendMessage(from, aiResponse);
  
  // Se IA detectar que o pedido está completo:
  // await osRepository.create({ clienteId, especificacoes: aiResponse.entities });
}
```

### 3.6 Variáveis de ambiente necessárias para MS2

Adicionar ao `.env`:
```env
# --- IA / LangChain ---
OPENAI_API_KEY=sk-...
# ou
GOOGLE_AI_API_KEY=AI...

# Modelo a utilizar
LLM_MODEL=gpt-4o-mini
# ou gemini-2.0-flash
```

---

## 4. Riscos e pontos de atenção

> [!WARNING]
> **Senha no seed em plain text** — A brecha #5 (seed com senha sem hash) foi propositalmente adiada. Deve ser corrigida antes de qualquer deploy fora de localhost.

> [!IMPORTANT]
> **Rate limits da OpenAI/Google** — Na Milestone 2, considerar implementar retry com exponential backoff e rate limiting para chamadas de IA.

> [!NOTE]
> **Custo de embeddings** — Ao popular a base de conhecimento (Card 12), cada documento gera um custo de API. Planejar o tamanho da base e o chunking strategy antes de executar.
