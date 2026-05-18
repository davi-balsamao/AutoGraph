# Aguardar aprovação
Aguarda a reação do cliente ao orçamento: aprovação, rejeição, dúvida ou silêncio.
Ações do agente neste estado
- Aguardar resposta sem enviar mensagens adicionais antes do timeout
- NÃO repetir o orçamento antes do cliente reagir
- Registrar momento do envio para controle de timeout
Transições possíveis
→ COLETAR_DADOS_ENTREGA — Cliente aprova explicitamente
→ NEGOCIAR — Cliente questiona preço, prazo ou condições
→ ESCLARECER_DUVIDAS — Cliente faz dúvida sobre o orçamento
→ ENCERRAR — Cliente recusa explicitamente
→ AGUARDAR_RETORNO — Nenhuma resposta após timeout