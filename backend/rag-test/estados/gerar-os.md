# Gerar O.S.
Registra formalmente a Ordem de Serviço no sistema com todos os dados do pedido.
Ações do agente neste estado
- Gravar todos os campos na O.S.: produto, specs, qtd, valor, prazo, cliente, entrega
- Enviar número da O.S. ao cliente como comprovante
- Informar próximos passos: pagamento, envio de arte, produção
- NÃO alterar a O.S. após gerada — qualquer mudança vai para humano
Transições possíveis
→ ENCERRAR — O.S. confirmada e informações enviadas ao cliente