# Walkthrough — Correção de Brechas + Cards 6, 7, 8

## Resumo

Resolvidas 6 das 7 brechas identificadas na auditoria e implementados os 3 cards pendentes (6, 7, 8) que completam o fluxo core da Milestone 1.

## Brechas Corrigidas

| # | Brecha | Correção |
|---|--------|----------|
| 1 | Rotas registradas direto no `server.ts` (bypass) | `server.ts` agora importa e usa `webhook.routes.ts` |
| 2 | Sem `.gitignore` na raiz | Criado `.gitignore` na raiz do projeto |
| 3 | Naming `omniconnect_*` no Docker | Renomeado para `autograph_*` |
| 4 | `WA_VERIFY_TOKEN` duplicada no `.env.example` | Removida — manteve apenas `WEBHOOK_VERIFY_TOKEN` |
| 5 | Senha plain text no seed | ⏸️ Não corrigida (a pedido do usuário) |
| 6 | Código morto (pages/ no Flutter, .gitkeep) | Deletados `pages/` duplicados e `.gitkeep` substituídos |
| 7 | Sem instância Prisma na aplicação | Criado `src/config/prisma.ts` singleton |

## Cards Implementados

### Card 6 — POST /webhook
- Adicionado método `receive` no `WebhookController`
- Criado `src/utils/whatsapp.parser.ts` para parse isolado do payload
- Rota POST registrada em `webhook.routes.ts`
- Responde 200 OK imediatamente (requisito Meta)

### Card 7 — Integração BD + Cadastro Cliente
- Criado `src/config/prisma.ts` — singleton centralizado
- Criado `src/repositories/cliente.repository.ts` — findByPhone + create
- Criado `src/repositories/mensagem.repository.ts` — create + findByUsuarioId
- Criado `src/services/webhook.service.ts` — orquestra todo o fluxo

### Card 8 — Fluxo Base Completo (Echo)
- `WebhookService.processIncomingMessage()` executa o pipeline:
  1. Verifica/cadastra cliente pelo telefone
  2. Salva mensagem no banco com payload bruto
  3. Chama `WhatsAppService.sendMessage()` para enviar echo
- `WhatsAppService` já existia mas nunca era invocado — agora está integrado

## Arquivos Criados
- `/.gitignore`
- `/backend/src/config/prisma.ts`
- `/backend/src/utils/whatsapp.parser.ts`
- `/backend/src/repositories/cliente.repository.ts`
- `/backend/src/repositories/mensagem.repository.ts`
- `/backend/src/services/webhook.service.ts`

## Arquivos Modificados
- `/docker-compose.yml` — naming fix
- `/backend/.env.example` — variável duplicada removida
- `/backend/src/server.ts` — usa router em vez de rotas diretas
- `/backend/src/controllers/webhook.controller.ts` — adicionado `receive`
- `/backend/src/routes/webhook.routes.ts` — adicionada rota POST

## Arquivos Deletados
- `/frontend/lib/features/auth/presentation/pages/login_page.dart`
- `/frontend/lib/features/os_cliente/presentation/pages/os_cliente_page.dart`
- `/frontend/lib/features/admin_grafica/presentation/pages/admin_dashboard_page.dart`
- `/backend/src/repositories/.gitkeep`
- `/backend/src/utils/.gitkeep`
- `/backend/src/config/.gitkeep`

## Validação
- ✅ `npx tsc --noEmit` — compilação TypeScript sem erros
