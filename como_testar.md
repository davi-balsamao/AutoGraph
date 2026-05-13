# 🧪 Como Testar o Projeto AutoGraph

**Última atualização:** 13/05/2026  
**Escopo testável:** Milestones 1 e 2 (Cards 1–18) + Endpoints parciais da Milestone 3

---

## 📋 Pré-Requisitos

Antes de qualquer teste, certifique-se de ter instalado:

| Ferramenta | Versão Mínima | Verificação |
|-----------|---------------|-------------|
| **Docker Desktop** | 4.x | `docker --version` |
| **Node.js** | 18+ | `node --version` |
| **npm** | 9+ | `npm --version` |
| **Flutter** | 3.x | `flutter --version` |
| **Git** | 2.x | `git --version` |

---

## 1️⃣ Subir a Infraestrutura (Docker + Banco)

### 1.1 — Subir o PostgreSQL com pgvector

```powershell
# Na raiz do projeto
cd c:\Davi\AutoGraph
docker-compose up -d db
```

> Isso sobe o container `autograph_db` com PostgreSQL + extensão pgvector na porta **5432**.

### 1.2 — Verificar que o banco subiu

```powershell
docker ps
# Deve mostrar o container "autograph_db" com status "Up"

# Testar conexão (opcional, requer psql ou DBeaver):
# Host: localhost | Port: 5432 | User: user_grafica | Pass: password_segura | DB: printflow_db
```

---

## 2️⃣ Configurar e Rodar o Backend

### 2.1 — Instalar dependências

```powershell
cd c:\Davi\AutoGraph\backend
npm install
```

### 2.2 — Configurar o `.env`

Copie o `.env.example` para `.env` e preencha:

```powershell
cp .env.example .env
```

**Edite o `.env`** e configure pelo menos:

```env
DATABASE_URL="postgresql://user_grafica:password_segura@localhost:5432/printflow_db"
PORT=3000
WEBHOOK_VERIFY_TOKEN=dev_token_123
USE_MOCK_WHATSAPP=true
GOOGLE_API_KEY=<sua_chave_gemini_aqui>
LLM_MODEL=gemini-2.0-flash
CONVERSATION_HISTORY_LIMIT=20
```

> [!IMPORTANT]
> Para testar a IA (Cards 11-18), é **obrigatório** ter uma chave válida da API do Google Gemini.
> Acesse [Google AI Studio](https://aistudio.google.com/app/apikey) para gerar uma gratuitamente.

### 2.3 — Rodar as migrations do Prisma

```powershell
npx prisma migrate dev
```

> Isso cria todas as tabelas no banco: `Usuario`, `OrdensDeServico`, `Mensagens`, `DocumentosConhecimento`.

### 2.4 — Popular o banco com dados iniciais (seed)

```powershell
# Seed de usuários (gerente + cliente mockados)
npx prisma db seed

# Seed da base de conhecimento vetorial (RAG)
npm run seed:knowledge
```

### 2.5 — Iniciar o servidor

```powershell
npm run dev
```

> O servidor inicia em `http://localhost:3000`. Você deve ver:
> ```
> ✅ SUCESSO: Lemos fisicamente X variáveis do arquivo .env!
> Server is running on port 3000
> ```

---

## 3️⃣ Testar os Endpoints (Backend)

### 3.1 — Testar a rota raiz

```powershell
curl http://localhost:3000/
```

**Resposta esperada:**
```json
{"message":"Hello World from AutoGraph API!"}
```

---

### 3.2 — Validação do Webhook (GET) — Card 5

```powershell
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=dev_token_123&hub.challenge=1158201444"
```

**Resposta esperada:** `1158201444` (o challenge de volta)

**Teste com token errado:**
```powershell
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=token_errado&hub.challenge=1158201444"
```

**Resposta esperada:** HTTP 403 (Forbidden)

---

### 3.3 — Simular recebimento de mensagem via WhatsApp (POST) — Cards 6-8, 13-18

Este é o teste mais completo. Simula uma mensagem de cliente chegando pelo WhatsApp:

```powershell
curl -X POST http://localhost:3000/webhook `
  -H "Content-Type: application/json" `
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "1234567890_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "5511900000000",
            "phone_number_id": "123456123_PHONE_ID"
          },
          "contacts": [{
            "profile": { "name": "João da Silva (Cliente Mock)" },
            "wa_id": "5511999998888"
          }],
          "messages": [{
            "from": "5511999998888",
            "id": "wamid.HBgLMTY1MD...",
            "timestamp": "1665476043",
            "text": { "body": "Olá, gostaria de imprimir 1000 cartões de visita." },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

> [!TIP]
> Também é possível usar o arquivo `simulate_webhook.http` na raiz do projeto, abrindo-o com a extensão **REST Client** do VS Code e clicando em "Send Request".

**O que verificar no terminal do backend:**
1. `🆕 Novo cliente detectado` (na primeira mensagem)
2. `💾 Mensagem salva no banco`
3. `🤖 Enviando para o RagService`
4. `✅ Resposta da IA gerada (X docs usados)`
5. `[MOCK WPP] Mensagem enviada para 5511999998888: ...` (modo mock)

**Para simular uma conversa completa (multi-turno):**

Envie múltiplas mensagens na sequência mudando o `body`:
1. `"Olá, gostaria de imprimir 1000 cartões de visita."` → IA vai perguntar detalhes
2. `"Sim, tenho a arte pronta. Quero em papel couchê 300g."` → IA pergunta mais
3. `"Colorido frente e verso, tamanho 9x5cm."` → Se completo: cria OS + transbordo

---

### 3.4 — Listar Ordens de Serviço — Cards 16, 22

```powershell
# Todas as OS
curl http://localhost:3000/api/os

# Apenas OS aguardando orçamento
curl "http://localhost:3000/api/os?status=AGUARDANDO_ORCAMENTO"
```

---

### 3.5 — Histórico de Mensagens de uma OS — Card 21

```powershell
# Substitua {id} pelo UUID da OS retornado no passo anterior
curl http://localhost:3000/api/os/{id}/mensagens
```

**Resposta esperada:**
```json
[
  { "id": "...", "remetente": "cliente", "texto": "Olá, gostaria de...", "data_hora": "..." },
  { "id": "...", "remetente": "ia", "texto": "Olá! Para cartões de visita...", "data_hora": "..." }
]
```

---

### 3.6 — Atualizar status da OS — Card 22

```powershell
curl -X PATCH http://localhost:3000/api/os/{id}/status `
  -H "Content-Type: application/json" `
  -d '{"status": "EM_PRODUCAO"}'
```

**Status válidos:** `CRIADA`, `AGUARDANDO_ORCAMENTO`, `EM_PRODUCAO`, `PRONTA_PARA_RETIRADA`, `ENTREGUE`, `CANCELADA`

---

### 3.7 — Login (Autenticação) — Card 23 (backend)

```powershell
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email": "gerente@grafica.com", "senha": "senha_segura_gerente"}'
```

**Resposta esperada:**
```json
{
  "user": {
    "id": "...",
    "nome": "Gerente Gráfica",
    "email": "gerente@grafica.com",
    "telefone": "5511988888888",
    "role": "GERENTE"
  }
}
```

---

### 3.8 — Timer de Produção

```powershell
# Iniciar timer
curl -X PATCH http://localhost:3000/api/os/{id}/timer/start

# Parar timer
curl -X PATCH http://localhost:3000/api/os/{id}/timer/stop
```

---

## 4️⃣ Testes Automatizados de IA

O backend inclui scripts de teste dedicados para cada componente de IA:

### 4.1 — Testar RAG (Busca Vetorial + Resposta IA)

```powershell
cd c:\Davi\AutoGraph\backend
npm run test:rag
```

> Testa 5+ perguntas sobre produtos gráficos. Valida que a IA responde usando a base de conhecimento e NÃO fornece preços.

### 4.2 — Testar Guardrails (Bloqueio de Preços)

```powershell
npm run test:guardrails
```

> Testa cenários adversariais onde o cliente tenta forçar a IA a dar preços.

### 4.3 — Testar Extração de Entidades

```powershell
npm run test:entities
```

> Testa a capacidade da IA de extrair informações do pedido (produto, quantidade, acabamento, etc.).

### 4.4 — Teste E2E do Webhook

```powershell
npm run test:e2e
```

> Simula o fluxo completo: mensagem → webhook → IA → resposta. Sem dependência do WhatsApp real.

---

## 5️⃣ Explorar o Banco de Dados (Prisma Studio)

```powershell
cd c:\Davi\AutoGraph\backend
npx prisma studio
```

> Abre o Prisma Studio em `http://localhost:5555`.
> Aqui você pode visualizar e editar diretamente as tabelas:
> - **Usuario** — clientes e gerente cadastrados
> - **OrdensDeServico** — OS criadas pela IA
> - **Mensagens** — histórico completo de conversas
> - **DocumentosConhecimento** — chunks da base vetorial

---

## 6️⃣ Testar o Frontend Flutter (Básico)

### 6.1 — Rodar no Chrome (Web)

```powershell
cd c:\Davi\AutoGraph\frontend
flutter pub get
flutter run -d chrome
```

> O app deve abrir no navegador com a tela de Login.

### 6.2 — Rodar no Emulador Android

```powershell
flutter run -d emulator
```

> [!WARNING]
> O Flutter requer Android Studio com emulador configurado ou dispositivo físico conectado via USB.

---

## 7️⃣ Teste Ponta-a-Ponta (Caminho Feliz Completo)

Para testar o fluxo completo do MVP, siga esta sequência:

### Passo 1: Garantir que tudo está rodando
- [ ] Docker com PostgreSQL subiu (`docker ps`)
- [ ] Backend rodando (`npm run dev` → porta 3000)
- [ ] Base de conhecimento populada (`npm run seed:knowledge`)

### Passo 2: Simular um atendimento completo
Envie 3-4 mensagens POST via `curl` ou `simulate_webhook.http`:

| # | Mensagem do "Cliente" | Expectativa |
|---|----------------------|-------------|
| 1 | "Olá, quero fazer cartões de visita" | IA pergunta detalhes (quantidade, arte, papel) |
| 2 | "500 unidades, tenho a arte pronta" | IA pergunta acabamento, tamanho |
| 3 | "Colorido frente e verso, couchê 300g, 9x5cm" | IA detecta pedido completo |
| 4 | (automático) | IA cria OS + envia msg transbordo |

### Passo 3: Verificar os resultados

```powershell
# 1. Verificar a OS criada
curl http://localhost:3000/api/os

# 2. Verificar o histórico da conversa
curl http://localhost:3000/api/os/{id}/mensagens

# 3. Verificar no Prisma Studio
npx prisma studio
```

### Passo 4: Simular ação da recepcionista

```powershell
# Atualizar status da OS para EM_PRODUCAO
curl -X PATCH http://localhost:3000/api/os/{id}/status `
  -H "Content-Type: application/json" `
  -d '{"status": "EM_PRODUCAO"}'
```

---

## ❓ Solução de Problemas Comuns

| Problema | Solução |
|----------|---------|
| `Cannot connect to the database` | Verifique se o Docker está rodando: `docker-compose up -d db` |
| `GOOGLE_API_KEY not set` | Preencha a chave no `.env`. Gere em [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `429 Too Many Requests` | Rate limit da API Gemini. Aguarde 1 minuto ou mude para `gemini-2.0-flash` |
| `seed:knowledge` falha | Verifique se o pgvector está ativo: `docker-compose up -d db` e rode as migrations |
| `Port 5432 already in use` | Outro PostgreSQL está rodando. Pare-o ou mude a porta no `docker-compose.yml` |
| `prisma migrate` falha | Verifique `DATABASE_URL` no `.env` e se o container do DB está rodando |
| Frontend não compila | Rode `flutter pub get` e verifique `flutter doctor` |

---

## 📁 Estrutura de Testes Disponíveis

```
backend/src/scripts/
├── seed-knowledge.ts        # Popular base vetorial (npm run seed:knowledge)
├── test-rag.ts              # Testar RAG completo (npm run test:rag)
├── test-guardrails.ts       # Testar bloqueio de preços (npm run test:guardrails)
├── test-entity-extraction.ts # Testar extração de entidades (npm run test:entities)
├── test-e2e-webhook.ts      # Teste E2E do webhook (npm run test:e2e)
├── test-api.ts              # Teste básico da API
├── quick-test.ts            # Teste rápido de sanidade
├── list-models.ts           # Listar modelos disponíveis
└── test_limit.ts            # Testar limites de rate
```
