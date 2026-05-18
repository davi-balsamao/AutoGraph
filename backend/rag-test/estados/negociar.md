# Negociar
Trata objeções de preço, prazo ou condições dentro dos limites de margem autorizados pela gráfica.
Ações do agente neste estado
- Verificar margem máxima de desconto nas regras de negócio antes de responder
- Oferecer alternativas: menos acabamento, quantidade maior, prazo mais longo
- NÃO prometer desconto acima da margem autorizada
- NÃO dar desconto sem oferecer justificativa ou alternativa
Transições possíveis
→ AGUARDAR_APROVACAO — Nova proposta enviada ao cliente
→ ESCALAR_HUMANO — Desconto exigido está acima da margem
→ ENCERRAR — Cliente recusa após contraproposta