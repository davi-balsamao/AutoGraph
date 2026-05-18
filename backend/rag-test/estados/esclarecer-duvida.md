# Esclarecer dúvidas
Estado temporário que responde perguntas técnicas ou comerciais sem avançar o fluxo. Retorna sempre ao estado anterior.
Ações do agente neste estado
- Responder exclusivamente com base no RAG e na base de conhecimento
- Registrar em contexto qual estado será retomado após a resposta
- NÃO calcular nem apresentar orçamento neste estado
- NÃO responder perguntas fora do escopo da gráfica
Transições possíveis
→ (estado anterior) — Dúvida respondida — retoma onde estava
→ ESCALAR_HUMANO — Pergunta está além do alcance do RAG