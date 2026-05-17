import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationState, SessaoRecord } from '../states';

const RECLAMACAO_HANDLER = /\b(reclamação|reclamacao|problema grave|processo|advogado|péssimo|pessimo|saiu errado|saiu completamente errado|errad[oa]s?|inaceit[aá]vel|inaceitaveis|diferente do que pedi|n[aã]o era isso|ficou errado|ficou diferente|incorret[oa]s?|insatisfeit[oa]|produto errado|qualidade p[eé]ssima)\b/i;
const HUMANO_HANDLER = /\b(atendente|humano|gerente|pessoa|falar com alguém|falar com alguem)\b/i;

function saudacaoPorHorario(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export class BoasVindasHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    _deps: HandlerDeps
  ): Promise<HandlerResult> {
    const saudacao = saudacaoPorHorario();
    const msg = message.toLowerCase();
    const clientePerguntouComoVai =
      /\b(tudo bem|como vai|como está|como esta|beleza)\b/.test(msg);

    // Escalada imediata: reclamação ou pedido de humano já na abertura
    if (RECLAMACAO_HANDLER.test(msg) || HUMANO_HANDLER.test(msg)) {
      return {
        response: '',
        nextState: ConversationState.ESCALAR_HUMANO,
        updatedContext: { ...sessao.contexto },
        chainNext: ConversationState.ESCALAR_HUMANO,
      };
    }

    const complemento = clientePerguntouComoVai ? ' Tudo bem e voce?' : '';
    const response = `${saudacao},${complemento} A AutoGraph agradece o seu contato! Como posso te ajudar?`;

    return {
      response,
      nextState: ConversationState.IDENTIFICAR_NECESSIDADE,
      updatedContext: { ...sessao.contexto },
    };
  }
}

export const boasVindasHandler = new BoasVindasHandler();
