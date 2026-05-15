# Apresentar orçamento
Formata e envia o orçamento completo ao cliente, incluindo validade da proposta.
Ações do agente neste estado
- Formatar: produto, specs, quantidade, preço unitário, total, prazo, entrega
- Informar validade do orçamento (ex: 3 dias úteis)
- NÃO fazer pergunta de aprovação na mesma mensagem
Transições possíveis
→ AGUARDAR_APROVACAO — Orçamento enviado