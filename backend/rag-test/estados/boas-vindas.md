# Boas-vindas
Primeiro contato. O agente se identifica e convida o cliente a explicar sua necessidade sem presumir nada.
Ações do agente neste estado:
- Enviar saudação com nome da gráfica e do agente
- Registrar horário de início para controle de SLA
- NÃO assumir produto, quantidade ou urgência
- NÃO listar cardápio de produtos proativamente
Transições possíveis
→ IDENTIFICAR_NECESSIDADE — Cliente responde qualquer mensagem
→ ESCALAR_HUMANO — Primeira mensagem já é reclamação grave
→ AGUARDAR_RETORNO — Nenhuma resposta após timeout inicial