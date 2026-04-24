# [Infra] Configuração do Ambiente Docker (PostgreSQL + Node.js)

## 📖 Descrição
Para garantir um ambiente de desenvolvimento padronizado e idêntico ao de produção, precisamos conteinerizar o banco de dados PostgreSQL e preparar a orquestração com o backend Node.js. O objetivo desta tarefa é criar o arquivo `docker-compose.yml` e o `Dockerfile` do backend, estabelecendo a base da infraestrutura local conforme definido no Milestone 1.

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Arquivo `docker-compose.yml` criado na raiz do projeto contendo o serviço do PostgreSQL.
- [ ] O PostgreSQL deve ter credenciais padrão injetadas via variáveis de ambiente e volume mapeado para persistência.
- [ ] Arquivo `Dockerfile` criado na pasta `backend/`.
- [ ] Os containers sobem sem erros ao executar `docker-compose up -d`.
- [ ] Conexão local com o PostgreSQL estabelecida com sucesso via cliente SQL (ex: DBeaver, pgAdmin).

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Criar arquivo `docker-compose.yml` na raiz.
- [ ] Configurar serviço `db` usando a imagem oficial do Postgres.
- [ ] Configurar rede interna no docker-compose.
- [ ] Criar a estrutura base `/backend`.
- [ ] Criar o `Dockerfile` inicial para a aplicação Node.js.
- [ ] Validar a execução dos containers localmente.

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend/DevOps]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`infraestrutura` `docker` `prioridade-alta` `milestone-1`

## 🔗 Anexos ou Referências Técnicas
- [README.md - Seção de Infraestrutura](../../README.md)
- [Documentação Oficial do Docker Compose](https://docs.docker.com/compose/)

## 🔀 Relacionamento entre Cards
- **Depende de:** N/A.
- **Bloqueia:** Card 2 (Modelagem do Banco), Card 3 (Setup do Backend Node.js).
