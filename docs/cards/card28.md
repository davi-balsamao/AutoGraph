# [Infraestrutura] Deploy do Backend (Render/VPS) e DB

## 📖 Descrição
Preparar o sistema para a banca. O banco PostgreSQL com PgVector e a API Node.js precisam estar online 24/7. O webhook na Meta deve apontar para um domínio HTTPS real e não mais para o NGROK local.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Banco de Dados PostgreSQL instanciado na nuvem.
- [ ] Extensão `pgvector` ativa e catálogo populado (`seed:knowledge`).
- [ ] API Node.js rodando (Render, Heroku, DigitalOcean, etc).
- [ ] App Meta Developers atualizado com o link público da API.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Configurar variáveis de ambiente na nuvem.
- [ ] Rodar migrations no banco remoto.
- [ ] Subir o código ou container Docker e conferir logs.
- [ ] Enviar mensagem pelo Zap e conferir se o Webhook responde normalmente.

## 👤 Atribuição
**Responsável:** [A Definir]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`infraestrutura` `deploy` `milestone-3`

## 🔀 Relacionamento entre Cards
- **Depende de:** Todos os cards backend.
- **Bloqueia:** Teste Final (Card 29).
