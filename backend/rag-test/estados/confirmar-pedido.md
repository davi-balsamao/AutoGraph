# Confirmar pedido
Exibe resumo completo do pedido e aguarda confirmação afirmativa antes de gerar a O.S.
Ações do agente neste estado
- Listar tudo: produto, specs, quantidade, valor total, prazo, entrega
- Fazer pergunta direta: "Confirma este pedido?"
- NÃO gerar O.S. sem resposta afirmativa explícita do cliente
- Se cliente corrigir algo: retornar ao campo incorreto
Transições possíveis
→ GERAR_OS — Cliente confirma explicitamente
→ COLETAR_ESPECIFICACOES — Cliente corrige especificação ou endereço
→ ESCALAR_HUMANO — Divergência grave que não pode ser corrigida pelo bot