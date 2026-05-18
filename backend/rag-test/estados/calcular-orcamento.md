# Calcular orçamento
Aplica a tabela de preços interna para montar o orçamento com base nas especificações coletadas e validadas.
Ações do agente neste estado
- Aplicar tabela de preços do produto específico
- Verificar quantidade mínima e ajustar antes de calcular
- Incluir prazo padrão; calcular expresso se solicitado
- NÃO apresentar o resultado neste estado — apenas calcular e mandar para o app
Observação sobre a arte
A validação técnica do arquivo de arte (DPI, sangria, dimensões) não é feita pelo bot — o cliente apenas confirmou que tem a arte pronta. Essa validação é responsabilidade da recepcionista e estará registrada no campo "observações" da O.S.

Transições possíveis
→ APRESENTAR_ORCAMENTO — Cálculo concluído com sucesso