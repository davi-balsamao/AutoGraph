import { guardrailsService } from '../../services/guardrails.service';
import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';

export class CalcularOrcamentoHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const context: ConversationContext = { ...sessao.contexto };

    const calcPrompt =
      'Com base nas especificações já coletadas no contexto, calcule o valor total usando APENAS a tabela de preços. Responda em uma linha no formato: TOTAL: R$ X.XXX,XX | PRAZO: N dias úteis | VALIDADE: 3 dias úteis';

    const ragResult = await deps.ragService.queryWithState(
      calcPrompt,
      ConversationState.CALCULAR_ORCAMENTO,
      context,
      deps.conversationHistory || undefined
    );

    const prices = guardrailsService.extractPrices(ragResult.answer);
    const total = prices.length > 0 ? Math.max(...prices) : 0;

    const prazoMatch = ragResult.answer.match(/PRAZO:\s*([^|]+)/i);
    const validadeMatch = ragResult.answer.match(/VALIDADE:\s*(.+)/i);

    if (total > 0) {
      context.orcamento = {
        total,
        prazo: prazoMatch?.[1]?.trim() || '3 dias úteis',
        validade: validadeMatch?.[1]?.trim() || '3 dias úteis',
        detalhes: ragResult.answer.slice(0, 300),
      };
    }

    return {
      response: '',
      nextState: ConversationState.APRESENTAR_ORCAMENTO,
      updatedContext: context,
      chainNext: ConversationState.APRESENTAR_ORCAMENTO,
    };
  }
}

export const calcularOrcamentoHandler = new CalcularOrcamentoHandler();
