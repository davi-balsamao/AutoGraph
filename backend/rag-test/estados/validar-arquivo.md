# Validar arquivo
Verifica se o arquivo de arte enviado pelo cliente atende os requisitos técnicos antes de seguir para orçamento.
Ações do agente neste estado
- Checar formato aceito: PDF, TIFF, JPG, PNG
- Checar resolução mínima: 300 dpi
- Checar dimensões + margem de sangria exigida
- NÃO avançar para cálculo se o arquivo estiver inválido
Transições possíveis
→ CALCULAR_ORCAMENTO — Arquivo aprovado em todos os critérios
→ COLETAR_ESPECIFICACOES — Arquivo inválido — solicita reenvio com instruções claras