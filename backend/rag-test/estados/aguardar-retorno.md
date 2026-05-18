# Aguardar retorno
Cliente ficou inativo. O agente aguarda um tempo e envia um único lembrete antes de encerrar.
Ações do agente neste estado
- Registrar estado atual e contexto no momento da inatividade
- Enviar lembrete ÚNICO após timeout curto (ex: 30 min)
- NÃO enviar múltiplos lembretes — apenas um
- Encerrar automaticamente após timeout máximo (ex: 24 h)
Transições possíveis
→ (estado registrado) — Cliente retorna dentro do período de espera
→ ENCERRAR — Timeout máximo atingido sem resposta