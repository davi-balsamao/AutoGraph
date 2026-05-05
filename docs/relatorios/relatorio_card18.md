# Relatório de Entrega: Card 18

Este documento resume as implementações realizadas para fechar o **Card 18 ([Backend/IA] Guardrails e Validação de Preços)**. Ele serve como guia para a equipe revisar e testar o serviço de validação das respostas da Inteligência Artificial.

---

## 🎯 O que foi entregue (Critérios de Aceite)

- **Serviço de Guardrails:** Foi criado o serviço `backend/src/services/guardrails.service.ts` responsável por interceptar a resposta da IA e aplicar regras rigorosas de validação de escopo e alucinação de preços.
- **Validação de Preços via Regex:** Implementada lógica para extração de valores monetários (ex: R$ 50,00) das respostas geradas e cruzamento destes valores de forma estrita com os presentes nos documentos de contexto (`Document` do LangChain).
- **Filtro de Escopo:** Adicionada uma verificação por palavras-chave/tópicos que garante que a IA não responda a perguntas fora do contexto da gráfica (ex: previsão do tempo, programação), retornando um status de bloqueio.
- **Script de Teste Offline:** Como o `RagService` (Card 13) ainda não estava disponível, foi criado um script isolado `backend/src/scripts/test-guardrails.ts` para validar exaustivamente o comportamento da classe.
- **Correção de Dependências:** O import das classes de documentos do LangChain foi ajustado para utilizar a versão mais recente (`@langchain/core/documents`).
- **Comando NPM:** Adicionado o atalho `"test:guardrails": "ts-node-dev src/scripts/test-guardrails.ts"` no `package.json` do backend para rodar a suíte de testes do serviço de guardrails.

---

## 🧪 Como testar e revisar (Comandos para a equipe)

### 1. Rodar os testes de Guardrails
A validação foi construída com 7 cenários de teste que avaliam bloqueios a preços alterados, assuntos proibidos e passagens bem-sucedidas de respostas corretas.

Abra seu terminal, navegue até a pasta `backend` e execute o comando criado:

```bash
cd backend
npm run test:guardrails
```

### 2. Resultados Esperados no Console
O script irá processar e logar os seguintes cenários e verificar se a camada bloqueou ou aceitou a resposta com 100% de precisão nos bloqueios:
- **Cenário 1:** Resposta correta com preços exatos (Deve ser Válido).
- **Cenário 2:** Resposta com preço alterado/alucinado (Deve ser Bloqueado).
- **Cenário 3:** Resposta inventando um preço que não está no contexto (Deve ser Bloqueado).
- **Cenário 4:** Resposta com múltiplos preços, todos corretos (Deve ser Válido).
- **Cenário 5:** Resposta sem nenhum preço mencionado (Deve ser Válido).
- **Cenário 6:** Resposta fora do escopo (ex: "Qual a previsão do tempo?") (Deve ser Bloqueado).
- **Cenário 7:** Pergunta pedindo para ignorar instruções de segurança - Prompt Injection (Deve ser Bloqueado).

---

## 🔍 Para Revisão de Código (Pull Request)
Arquivos principais que a equipe deve revisar nesta entrega:
1. `backend/src/services/guardrails.service.ts` (Lógica central de validação de preços e escopo).
2. `backend/src/scripts/test-guardrails.ts` (Cenários simulados para validar o serviço).
3. `backend/package.json` (Adição do script NPM `test:guardrails`).
