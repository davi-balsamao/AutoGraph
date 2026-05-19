import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationContext, ConversationState, SessaoRecord } from '../states';
import { PricingReadAdapter } from '../../adapters/pricing.adapter';

export class CalcularOrcamentoHandler implements StateHandler {
  async handle(_message: string, sessao: SessaoRecord, _deps: HandlerDeps): Promise<HandlerResult> {
    const context: ConversationContext = { ...sessao.contexto };

    try {
      // O Orquestrador chama o Adapter para obter um valor determinístico
      const total = await PricingReadAdapter.calcular({
        produtoNome: context.produto || '',
        quantidade: Number(context.specs?.quantidade || 0),
        specs: context.specs
      });

      context.orcamento = {
        total,
        prazo: '3 dias úteis',
        validade: '3 dias úteis',
        detalhes: `Estimativa para ${context.produto}: R$ ${total.toFixed(2)}`,
      };

      const proximo = process.env.ADMIN_APPROVAL_REQUIRED === 'true'
        ? ConversationState.AGUARDAR_APROVACAO_ADMIN
        : ConversationState.APRESENTAR_ORCAMENTO;

      return {
        response: '',
        nextState: proximo,
        updatedContext: context,
        chainNext: proximo,
      };
    } catch (e) {
      console.error("Erro na Pipeline de Orçamento:", e);
      return { 
        response: "Desculpe, não consegui calcular o preço com os dados informados.", 
        nextState: ConversationState.ESCLARECER_DUVIDA, 
        updatedContext: context 
      };
    }
  }
}

export const calcularOrcamentoHandler = new CalcularOrcamentoHandler();