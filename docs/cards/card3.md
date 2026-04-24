# [Backend] Inicialização do Projeto Node.js e Setup da Arquitetura

## 📖 Descrição
Para que o webhook do WhatsApp consiga ser recebido e processado, precisamos de um servidor HTTP rodando. O objetivo aqui é iniciar o projeto Node.js, configurar o `package.json`, instalar dependências fundamentais e criar a estrutura de pastas seguindo a Layered Architecture descrita no README (Controller-Service-Repository).

## ✅ Critérios de Aceite (Definition of Done)
- [ ] Projeto iniciado com `npm init` (ou `yarn`/`pnpm`).
- [ ] Estrutura de diretórios `src/` criada (`config`, `routes`, `controllers`, `services`, `repositories`, `utils`).
- [ ] Servidor básico configurado (ex: com Express ou NestJS) respondendo um "Hello World" na porta 3000.
- [ ] Dependências iniciais instaladas (ex: express, dotenv, cors, nodemon/ts-node).
- [ ] Arquivo `.env.example` adicionado na raiz do `/backend`.

## 🛠️ Checklist de Tarefas Técnicas
- [ ] Executar comando de inicialização do projeto no diretório `backend/`.
- [ ] Configurar TypeScript (se aplicável, com `tsconfig.json`).
- [ ] Instalar framework web e utilitários básicos.
- [ ] Criar a hierarquia de pastas padrão da arquitetura.
- [ ] Criar o arquivo de entrypoint (`server.ts` ou `index.js`).
- [ ] Criar script no `package.json` para modo `dev` (hot reload).

## 👤 Atribuição
**Responsável:** [A Definir - Dev Backend]

## 📅 Prazo ou Previsão de Entrega
**Previsão:** 1 Dia útil.

## 🏷️ Etiquetas (Labels)
`backend` `nodejs` `setup` `prioridade-alta` `milestone-1`

## 🔗 Anexos ou Referências Técnicas
- [README.md - Estrutura de Pastas](../../README.md)

## 🔀 Relacionamento entre Cards
- **Depende de:** Card 1 (Configuração do Ambiente Docker).
- **Bloqueia:** Card 5 (Implementação Webhook GET), Card 7 (Integração com o Banco).
