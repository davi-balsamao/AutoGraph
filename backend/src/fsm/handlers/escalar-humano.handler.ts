/**
 * Handler do estado ESCALAR_HUMANO.
 *
 * Contrato ([rag-test/estados/escalar-humano.md]):
 *  • Informar ao cliente que um atendente especializado irá assumir
 *  • Registrar: estado anterior, campos coletados, motivo da escalada
 *  • NÃO tentar resolver após escalar
 *  • NÃO prometer prazo de retorno sem saber
 *
 * O flag `escalarHumano: true` faz o state-router marcar o cliente com
 * `atendimentoHumano = true`, silenciando o bot até intervenção manual.
 */

import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationState, SessaoRecord } from '../states';

const MENSAGEM_ESCALADA =
  'Entendi. Vou chamar um atendente da nossa equipe para te ajudar pessoalmente. Um momento!';

function inferirMotivo(estadoAnterior: string | null, message: string): string {
  const msg = message.toLowerCase();
  if (/reclama|problema|errado|erro|insatisfeit/.test(msg)) return 'Reclamação';
  if (/desconto|abuso|barato|caro/.test(msg)) return 'Negociação acima da margem';
  if (/humano|atendente|gerente|pessoa/.test(msg)) return 'Pedido explícito de atendente';
  return `Escalada a partir de ${estadoAnterior || 'estado indefinido'}`;
}

export class EscalarHumanoHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    _deps: HandlerDeps
  ): Promise<HandlerResult> {
    const motivo = inferirMotivo(sessao.estadoAnterior, message);
    const registro = {
      sessaoId: sessao.id,
      clienteId: sessao.clienteId,
      estadoAnterior: sessao.estadoAnterior,
      motivo,
      contexto: sessao.contexto,
      timestamp: new Date().toISOString(),
    };
    console.log('👤 [ESCALAR_HUMANO]', JSON.stringify(registro));

    return {
      response: MENSAGEM_ESCALADA,
      nextState: ConversationState.ESCALAR_HUMANO,
      updatedContext: sessao.contexto,
      escalarHumano: true,
    };
  }
}

export const escalarHumanoHandler = new EscalarHumanoHandler();
