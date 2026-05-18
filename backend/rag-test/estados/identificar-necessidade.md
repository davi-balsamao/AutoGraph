# Identificar necessidade
Compreender o produto desejado e a intenção do cliente: novo pedido, orçamento, dúvida ou reclamação.
Ações do agente neste estado
- Perguntar abertamente qual é a necessidade do cliente
- Identificar o produto no catálogo antes de qualquer coleta
- Detectar se é dúvida isolada → desviar para ESCLARECER_DUVIDAS
- NÃO coletar specs antes de confirmar o produto
Transições possíveis
→ COLETAR_ESPECIFICACOES — Produto identificado no catálogo
→ ESCLARECER_DUVIDAS — Cliente faz pergunta técnica ou comercial
→ PRODUTO_INDISPONIVEL — Produto solicitado fora do catálogo
→ ESCALAR_HUMANO — Cliente manifesta insatisfação ou reclamação
→ AGUARDAR_RETORNO — Cliente para de responder