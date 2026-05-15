# Calcular orçamento
Aplica a tabela de preços interna para montar o orçamento com base nas especificações coletadas e validadas.
Ações do agente neste estado
- Aplicar tabela de preços do produto específico
- Verificar quantidade mínima e ajustar antes de calcular
- Incluir prazo padrão; calcular expresso se solicitado
- NÃO apresentar o resultado neste estado — apenas calcular e mandar para o app
Transições possíveis
→ APRESENTAR_ORCAMENTO — Cálculo concluído com sucesso