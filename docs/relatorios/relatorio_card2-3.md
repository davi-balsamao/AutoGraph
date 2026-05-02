# Relatório de Entrega: Cards 2 e 3

Este documento resume as implementações realizadas para fechar os **Cards 2 (Modelagem DB Prisma)** e **Card 3 (Setup Node.js)**. Ele serve como guia para a equipe de contribuidores revisar e testar o que foi construído.

---

## 🎯 O que foi entregue (Critérios de Aceite)

### Card 3: Backend Node.js Setup
- **Estrutura de Pastas (Layered Architecture):** Criadas as pastas `config`, `routes`, `controllers`, `services`, `repositories` e `utils` dentro de `backend/src`.
- **Servidor Express + TypeScript:** O servidor está configurado em `src/server.ts` respondendo com um *Hello World* na porta `3000`.
- **Scripts de Desenvolvimento:** Adicionados scripts no `package.json` utilizando o `ts-node-dev` para *hot reload* automático.
- **Docker:** O `Dockerfile` do backend foi atualizado para iniciar com `npm run dev`.

### Card 2: Modelagem e Banco de Dados (Prisma + pgvector)
- **Extensão pgvector:** O `docker-compose.yml` foi atualizado para usar a imagem `pgvector/pgvector:pg15`, habilitando nativamente a busca vetorial para futura integração com IA (RAG).
- **Prisma ORM (v7):** Inicializado na pasta `backend/prisma`. O arquivo `schema.prisma` foi configurado e a propriedade `postgresqlExtensions` ativada.
- **Modelagem Realizada:**
  - `Usuario`: Com enum `Role` (CLIENTE, GERENTE), email, e campos para Firebase.
  - `OrdensDeServico`: Referenciada ao usuário, utilizando campo `JSONB` para flexibilidade técnica de impressão.
  - `Mensagens`: Registros do chat com campo para payload bruto em `JSONB`.
  - `DocumentosConhecimento`: Tabela base para a IA com suporte explícito a colunas `Unsupported("vector")`.
- **Migrations & Seed:** A primeira *migration* foi aplicada criando as tabelas na base de dados `printflow_db`. O script `seed.ts` foi rodado e inseriu 1 *Gerente* e 1 *Cliente* com sucesso utilizando o `@prisma/adapter-pg`.

---

## 🧪 Como testar e revisar (Comandos para a equipe)

Todos os serviços estão conteinerizados via Docker. Siga os passos abaixo na raiz do projeto:

### 0. Configurar Variáveis de Ambiente (.env)
Como boas práticas de segurança, arquivos `.env` são ignorados no repositório Git. Antes de rodar os containers, crie um arquivo chamado `.env` na pasta raiz do backend (`backend/.env`) com o seguinte conteúdo:
```env
DATABASE_URL="postgresql://user_grafica:password_segura@localhost:5432/printflow_db"
PORT=3000
```

### 1. Subir a Infraestrutura
```bash
docker compose up -d --build
```
Isso iniciará o banco de dados (na porta `5432`) e o servidor Node.js (na porta `3000`).

### 2. Testar a API (Express)
Você pode bater no endpoint principal da API para confirmar que o Node.js subiu corretamente:
- Acesse no seu navegador ou via ferramenta (Postman/Insomnia):
  👉 **http://localhost:3000**
- Ou via PowerShell:
  ```powershell
  Invoke-RestMethod http://localhost:3000
  ```
  *(Deve retornar `{"message": "Hello World from AutoGraph API!"}`)*

### 3. Verificar o Banco de Dados
Para checar se as tabelas e os *seeds* (usuários falsos) estão no banco, você tem duas opções:

**Opção A: Conexão Direta (Recomendada)**
Abra seu gerenciador de banco de dados favorito (DBeaver, PGAdmin, DataGrip) e conecte usando as credenciais do seu `.env` raiz:
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `printflow_db`
- **User:** `user_grafica`
- **Password:** `password_segura`

**Opção B: Prisma Studio**
Se preferir a interface visual do Prisma:
```bash
cd backend
npx prisma studio
```
*(Nota sobre o Windows: Se ao rodar `npx prisma studio` você enfrentar o erro `ERR_STREAM_UNABLE_TO_PIPE`, isso é um conflito conhecido da versão mais recente do Node/Prisma no Windows Terminal. Nesse caso, opte pela **Opção A** utilizando o DBeaver para ver as tabelas, a estrutura está toda lá!)*

---

## 🔍 Para Revisão de Código (Pull Request)
Arquivos chaves que a equipe deve revisar nesta entrega:
1. `docker-compose.yml` e `backend/Dockerfile` (Validação de containerização).
2. `backend/prisma/schema.prisma` (Revisão da modelagem Code-First e relacionamentos).
3. `backend/src/server.ts` (Bootstrap do servidor e injeção do Prisma no futuro).
4. `backend/package.json` e `backend/prisma.config.ts` (Garantir scripts e compatibilidade Prisma 7).
