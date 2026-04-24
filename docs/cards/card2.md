# [DB] Modelagem de Dados Base no PostgreSQL

## 📖 Descrição
Com a infraestrutura do banco de dados em pé, precisamos criar a estrutura das tabelas iniciais. Para o Milestone 1 e funcionamento básico do fluxo de mensagens, é necessário modelar e aplicar no banco as tabelas `Clientes`, `OrdensDeServico` e `Mensagens`.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Tabelas `Clientes`, `OrdensDeServico` e `Mensagens` criadas no banco de dados.
- [ ] Relacionamentos de chave estrangeira (Foreign Keys) configurados corretamente (ex: Mensagens apontando para Cliente/OS).
- [ ] Scripts SQL (ou arquivos de migration) devidamente salvos no repositório.
- [ ] Tipagem de dados adequada para cada coluna (ex: JSONB para payloads, UUID para IDs).

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Desenhar o esquema de dados das 3 entidades.
- [ ] Definir os tipos de dados e constraints (NOT NULL, UNIQUE, etc.).
- [ ] Escrever o script SQL de criação (DDL) ou usar ferramenta de migration (ex: Prisma, TypeORM, Knex).
- [ ] Aplicar as alterações no container do PostgreSQL local.
- [ ] Validar a criação populando o banco com dados mockados.

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend/DBA]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`banco-de-dados` `sql` `prioridade-alta` `milestone-1`

## 🔗 Anexos ou Referências Técnicas
- [README.md - Arquitetura de DB](../../README.md)
- Entidades básicas citadas no plano: `Clientes`, `OrdensDeServico`, `Mensagens`.

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 1 (Configuração do Ambiente Docker).
- **Bloqueia:** Card 7 (Salvamento de Mensagens no Banco).
