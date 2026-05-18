# Coletar especificações
Coleta progressiva dos campos obrigatórios para montar o orçamento (formato, gramatura, quantidade, acabamento etc.).
Ações do agente neste estado
- Perguntar UM campo por vez — nunca dois na mesma mensagem
- Validar cada resposta conforme regras do produto (enum, mín/máx)
- Registrar em contexto campos coletados e pendentes
- NÃO avançar para cálculo se algum campo obrigatório falta
Transições possíveis
→ ESCLARECER_DUVIDAS — Dúvida técnica surgir durante a coleta
→ VALIDAR_ARQUIVO — Todos os campos OK e produto exige arte do cliente
→ CALCULAR_ORCAMENTO — Todos os campos OK e produto não exige arte
→ AGUARDAR_RETORNO — Cliente some durante a coleta