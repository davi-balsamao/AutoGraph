/**
 * Handler do estado AGUARDAR_RETORNO.
 *
 * Contrato ([rag-test/estados/aguardar-retorno.md] + Regra 6):
 *  • Cliente está inativo após algum estado avançado
 *  • Lembrete ÚNICO via cron, controlado por `sessao.lembreteEnviado`
 *  • Encerra automaticamente após timeout máximo (via cron)
 *  • Cliente retornando → restaura fluxo no estado anterior
 *
 * Este handler é acionado quando cliente VOLTA a mandar mensagem.
 * O envio proativo do lembrete é feito pelo cron — não aqui.
 */

import { entityExtractionService } from '../../services/entity-extraction.service';
import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationState, SessaoRecord } from '../states';
import { transitionService } from '../transition.service';
import { prepareContext } from './base.handler';

export class AguardarRetornoHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const { context } = prepareContext(message, sessao, deps);
    const msg = message.trim();

    if (!msg) {
      return {
        response: '',
        nextState: ConversationState.AGUARDAR_RETORNO,
        updatedContext: context,
      };
    }

    // Cliente identificou produto na mensagem → retoma direto em coleta.
    const produto = entityExtractionService.identificarProdutoNaMensagem(msg);
    if (produto) {
      return {
        response: '',
        nextState: ConversationState.COLETAR_ESPECIFICACOES,
        updatedContext: { ...context, produto: produto.produto },
        chainNext: ConversationState.COLETAR_ESPECIFICACOES,
      };
    }

    // Caso geral: volta ao estado anterior, ou IDENTIFICAR_NECESSIDADE se desconhecido.
    const estadoRetomar = transitionService.restorePreviousState(sessao.estadoAnterior);

    return {
      response: 'Que bom que voltou! Vamos retomar de onde paramos.',
      nextState: estadoRetomar,
      updatedContext: context,
    };
  }
}

export const aguardarRetornoHandler = new AguardarRetornoHandler();
