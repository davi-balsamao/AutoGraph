# Escalar p/ humano
Transfere o atendimento para um atendente humano, enviando todo o contexto acumulado.
Ações do agente neste estado
- Informar ao cliente que um atendente especializado irá assumir
- Enviar ao sistema: estado anterior, campos coletados, motivo da escalada
- NÃO tentar resolver o problema após a decisão de escalar
- NÃO prometer prazo de retorno do atendente sem saber
Transições possíveis
→ (humano assume) — Estado terminal para o bot — humano lê o contexto e prossegue