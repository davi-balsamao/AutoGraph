import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationState, SessaoRecord } from '../states';

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
