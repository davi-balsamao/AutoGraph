import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';

export class ApresentarOrcamentoHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const context: ConversationContext = { ...sessao.contexto, orcamentoApresentado: true };
    const produto = context.produto || 'seu pedido';
    const total = context.orcamento?.total;
    const prazo = context.orcamento?.prazo || '3 dias úteis';
    const validade = context.orcamento?.validade || '3 dias úteis';

    let response: string;

    if (total && total > 0) {
      const valorFmt = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      response = `Orçamento aprovado! O valor total para ${produto} fica em ${valorFmt}. Prazo de produção: ${prazo}. Validade: ${validade}. O pagamento pode ser feito via Pix ou Cartão em até 3x. Podemos dar andamento?`;
    } else {
      const ragResult = await deps.ragService.queryWithState(
        message || 'Apresente o orçamento aprovado ao cliente com valor, prazo e validade.',
        ConversationState.APRESENTAR_ORCAMENTO,
        context,
        deps.conversationHistory || undefined
      );
      response = ragResult.answer;
    }

    return {
      response,
      nextState: ConversationState.AGUARDAR_APROVACAO,
      updatedContext: context,
    };
  }
}

export const apresentarOrcamentoHandler = new ApresentarOrcamentoHandler();
