/**
 * Handler do estado ENCERRAR.
 *
 * Contrato ([rag-test/estados/encerrar.md]):
 *  • Agradecer com cordialidade
 *  • Informar canal de acompanhamento (número da O.S. se houver)
 *  • NÃO retomar fluxo dentro da mesma sessão — nova mensagem = novo atendimento
 *
 * Nota: a regeneração automática de sessão após ENCERRAR é responsabilidade do
 * `state.service.getOrCreateSession` (Fase 2/3 do plano). Aqui, mantemos o
 * estado terminal e respondemos com cordialidade — clientes que continuam
 * mandando mensagens recebem despedidas educadas sem reativar o fluxo.
 */

import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationState, SessaoRecord } from '../states';
import { OsRepository } from '../../repositories/os.repository';
import { StatusOS } from '@prisma/client';
import { io } from '../../server';

const osRepo = new OsRepository();

function formatarOsId(osId?: string): string | null {
  if (!osId) return null;
  return osId.slice(0, 8).toUpperCase();
}

function montarResposta(clienteNome: string, osId?: string): string {
  const primeiroNome = (clienteNome || 'cliente').split(' ')[0];
  const osFmt = formatarOsId(osId);
  if (osFmt) {
    return `Obrigada pelo contato, ${primeiroNome}! Sua O.S. ${osFmt} já está registrada. Qualquer dúvida, é só chamar por aqui. Até logo!`;
  }
  return `Obrigada pelo contato, ${primeiroNome}! Se precisar de algo, é só chamar por aqui. Até logo!`;
}

export class EncerrarHandler implements StateHandler {
  async handle(
    _message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const osId = sessao.contexto.osId;
    if (osId) {
      try {
        const os = await osRepo.findById(osId);
        if (os && (os.status === StatusOS.CRIADA || os.status === StatusOS.AGUARDANDO_ORCAMENTO)) {
          const osAtualizada = await osRepo.updateStatus(osId, StatusOS.CANCELADA);
          io.emit('os-atualizada', osAtualizada);
          console.log(`📋 [KANBAN] OS ${osId.slice(0, 8)} cancelada pelo encerramento da conversa.`);
        }
      } catch (err) {
        console.error('❌ Erro ao cancelar OS no encerramento:', err);
      }
    }

    return {
      response: montarResposta(deps.clienteNome, sessao.contexto.osId),
      nextState: ConversationState.ENCERRAR,
      updatedContext: sessao.contexto,
    };
  }
}

export const encerrarHandler = new EncerrarHandler();
