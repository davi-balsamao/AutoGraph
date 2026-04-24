# [Backend] Integração do Backend com Banco de Dados e Cadastro de Cliente

## 📖 Descrição
As mensagens recebidas no Webhook não podem ficar apenas na memória. Elas precisam ser persistidas no nosso banco de dados relacional. Além disso, se o remetente for um número novo, o sistema deve criar um registro para ele na tabela `Clientes` antes de salvar a `Mensagem`.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Conexão do backend Node.js com o banco PostgreSQL ativa e sem falhas.
- [ ] Recebimento de uma mensagem nova no Webhook aciona a lógica de negócio (`Service`).
- [ ] Ao receber mensagem de um número desconhecido, o sistema insere o cliente no banco.
- [ ] A mensagem é persistida na tabela `Mensagens`, vinculada ao Cliente correspondente.
- [ ] Validação realizada confirmando a presença da mensagem nas tabelas via DBeaver/pgAdmin.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Instalar driver/biblioteca de conexão com o PostgreSQL (ex: `pg`, `Prisma`, `TypeORM`).
- [ ] Configurar conexão global (pool de conexões).
- [ ] Criar `ClienteRepository` e `MensagemRepository` para abstrair as consultas SQL.
- [ ] Criar `WebhookService` que orquestra as operações: Verifica Cliente -> Insere Cliente se faltar -> Salva Mensagem.
- [ ] Garantir tratamento de erros (`try/catch`) nas operações de banco de dados.

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1.5 Dias úteis.

## 🏷️ Etiquetas (Labels)
`backend` `banco-de-dados` `integracao` `milestone-1`

## 🔗 Anexos ou Referências Técnicas
- Estrutura de Pastas e Repositories (`README.md`).

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 2 (Modelagem Banco), Card 6 (Webhook POST).
- **Bloqueia:** Card 8 (Fechamento do Fluxo Base).
