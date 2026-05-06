# Conclusão e Fechamento das Correções (Milestone 2)

As vulnerabilidades listadas no nosso plano de auditoria foram corrigidas com sucesso. O sistema agora está blindado e pronto para se conectar ao Frontend Flutter na **Milestone 3**.

Abaixo, um resumo das correções de segurança (Security Patches) aplicadas:

## 1. Validação Criptográfica do Webhook
> [!IMPORTANT]
> Adicionamos a lógica de interceptação do *rawBody* via Express. Agora o `WebhookController` utiliza criptografia HMAC SHA-256 para checar a assinatura (header `X-Hub-Signature-256`) vinda da requisição. Se a assinatura não corresponder com a calculada usando o `APP_SECRET`, o request é barrado imediatamente com `403 Forbidden`.

## 2. Reforço de Guardrails (Preços)
> [!TIP]
> O `GuardrailsService` ganhou uma expressão regular robusta. O bot agora vai barrar a tentativa da IA de passar valores em outras moedas (`$`, `US$`) e palavras como `"custa X"`, `"orçamento de X"` e `"X reais"`, mitigando substancialmente as alucinações monetárias da IA para clientes espertos.

## 3. Mitigação de Prompt Injection
> [!NOTE]
> O `RagService` agora encapsula a entrada do cliente com tags delimitadoras `+++++` e instruções fortíssimas ordenando à IA tratar o input estritamente como *dados a serem preenchidos*, jamais executando comandos ocultos ali dentro.

## 4. Testes End-to-End Reais (HTTP)
O arquivo `test-e2e-webhook.ts` foi atualizado para **assinar criptograficamente as mensagens localmente e fazer chamadas HTTP reais** usando `fetch()` em vez de dar o bypass interno, simulando com fidelidade máxima a maneira que o sistema reagirá às mensagens da Meta em produção.

## 5. Correção do Crash do Vector DB
Padronizamos a criação simulada de Embeddings para `768 dimensões` (compatível com os modelos Gemini default) de modo que a consulta final do script `seed-knowledge.ts` no `pgvector` parou de apresentar erros por divergência dimensional.
