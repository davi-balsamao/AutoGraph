# Dados de entrega
Coleta endereço e contato para entrega ou confirma retirada em loja.
Ações do agente neste estado
- Perguntar modalidade: retirada ou entrega?
- Se entrega: coletar CEP, logradouro, número, complemento, cidade
- Confirmar prazo total incluindo frete se aplicável
- NÃO avançar sem definir modalidade
Transições possíveis
→ CONFIRMAR_PEDIDO — Dados de entrega coletados