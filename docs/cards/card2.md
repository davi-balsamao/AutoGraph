# [DB] Modelagem Code-First (Prisma) e Infraestrutura do Postgres

## 📖 Descrição
Para dar suporte ao Milestone 1 (fluxo de mensagens) e preparar o terreno para a IA (RAG) e o App Flutter, precisamos estruturar o banco de dados PostgreSQL. A modelagem será feita utilizando a abordagem **Code-First com Prisma ORM**, garantindo que o esquema do banco de dados e as tipagens do TypeScript no Node.js sejam geradas a partir de uma única fonte da verdade.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Container do PostgreSQL configurado via Docker com suporte à extensão `pgvector`.
- [ ] Prisma ORM inicializado no projeto backend (`npx prisma init`).
- [ ] Arquivo `schema.prisma` criado contendo as seguintes entidades base:
  - **Usuarios:** (Centraliza Clientes e Gerentes, prevendo campos para UUID e Firebase Auth).
  - **OrdensDeServico:** (Contendo campo JSONB para suportar especificações dinâmicas de impressão).
  - **Mensagens:** (Com suporte a armazenamento do payload bruto via JSONB).
  - **DocumentosConhecimento:** (Tabela com vetorização para consulta do LangChain/RAG).
- [ ] Primeira *migration* gerada e aplicada no banco de desenvolvimento (`npx prisma migrate dev`).
- [ ] Script de *seed* criado para popular o banco com 1 usuário gerente e 1 cliente mockado.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Adicionar o Prisma como dependência no backend (`npm install prisma --save-dev`).
- [ ] Definir a URL de conexão do PostgreSQL no arquivo `.env`.
- [ ] Escrever a modelagem no `schema.prisma`, utilizando *enums* para Status da OS, Roles (Cliente/Gerente) e Origem da Mensagem.
- [ ] Habilitar `postgresqlExtensions` no bloco do *generator* do Prisma para suportar vetores.
- [ ] Executar o comando de migration e validar a criação das tabelas via Prisma Studio (`npx prisma studio`).

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`banco-de-dados` `prisma-orm` `prioridade-alta` `milestone-1` `node.js`

## 🔗 Anexos ou Referências Técnicas
- [README.md - Arquitetura de DB](../../README.md)
- [Documentação do Prisma ORM](https://www.prisma.io/docs)
- [PGVector Setup via Prisma](https://www.prisma.io/docs/orm/prisma-client/queries/pgvector)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 1 (Configuração do Ambiente Docker).
- **Bloqueia:** Card 7 (Salvamento de Mensagens no Banco) e Card 8 (Setup Inicial do LangChain).