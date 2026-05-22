import { StatusOS } from '@prisma/client';
import { OsRepository } from '../repositories/os.repository';
import { sessaoRepository } from '../repositories/sessao.repository';
import {
  ConversationContext,
  ConversationState,
  parseContext,
  SessaoRecord,
} from '../fsm/states';

const osRepo = new OsRepository();

/**
 * Cancela OS órfã associada a uma sessão que está sendo encerrada/reiniciada.
 * Só cancela se a OS estiver em AGUARDANDO_ORCAMENTO (criada para revisão admin).
 * Emite Socket.io para o Kanban atualizar em tempo real.
 *
 * Importação tardia de `io` evita ciclo: state.service → server → state.service.
 */
async function cancelarOsOrfa(osId?: string) {
  if (!osId) return;
  try {
    const os = await osRepo.findById(osId);
    if (os && os.status === StatusOS.AGUARDANDO_ORCAMENTO) {
      const cancelada = await osRepo.updateStatus(osId, StatusOS.CANCELADA);
      const { io } = await import('../server');
      io.emit('os-atualizada', cancelada);
      console.log(`🗑️  [StateService] OS ${osId.substring(0, 8)} cancelada (sessão encerrada).`);
    }
  } catch (e) {
    console.warn('⚠️  Falha ao cancelar OS órfã:', e);
  }
}

export class StateService {
  async getOrCreateSession(clienteId: string): Promise<SessaoRecord> {
    let sessao = await sessaoRepository.findActiveByClienteId(clienteId);

    if (!sessao) {
      sessao = await sessaoRepository.create(clienteId);
    }

    return this.toRecord(sessao);
  }

  async transition(
    sessaoId: string,
    nextState: ConversationState,
    context: ConversationContext,
    options?: { previousState?: string | null }
  ): Promise<SessaoRecord> {
    const updated = await sessaoRepository.updateState(
      sessaoId,
      nextState,
      options?.previousState,
      context as object
    );
    return this.toRecord(updated);
  }

  async encerrar(sessaoId: string): Promise<void> {
    // Antes de encerrar, cancela OS órfã se houver
    const sessao = await sessaoRepository.findById(sessaoId);
    if (sessao) {
      const ctx = parseContext(sessao.contexto);
      await cancelarOsOrfa(ctx.osId);
    }
    await sessaoRepository.encerrar(sessaoId);
  }

  /** Encerra a sessão ativa e abre outra em BOAS_VINDAS (novo pedido do zero). */
  async reiniciarSessao(clienteId: string): Promise<SessaoRecord> {
    const ativa = await sessaoRepository.findActiveByClienteId(clienteId);
    if (ativa) {
      const ctx = parseContext(ativa.contexto);
      await cancelarOsOrfa(ctx.osId);
      await sessaoRepository.encerrar(ativa.id);
    }
    const nova = await sessaoRepository.create(clienteId);
    return this.toRecord(nova);
  }

  /** Limpa specs/orçamento; mantém a mesma sessão. */
  async reiniciarContextoPedido(
    sessaoId: string,
    produto?: string
  ): Promise<SessaoRecord> {
    const contexto: ConversationContext = produto ? { produto } : {};
    const estado = produto
      ? ConversationState.COLETAR_ESPECIFICACOES
      : ConversationState.IDENTIFICAR_NECESSIDADE;

    const updated = await sessaoRepository.updateState(
      sessaoId,
      estado,
      null,
      contexto as object
    );
    await sessaoRepository.setLembreteEnviado(sessaoId, false);
    return this.toRecord(updated);
  }

  private toRecord(sessao: {
    id: string;
    clienteId: string;
    estadoAtual: string;
    estadoAnterior: string | null;
    contexto: unknown;
    ativa: boolean;
    lembreteEnviado: boolean;
    criadoEm: Date;
    atualizadoEm: Date;
  }): SessaoRecord {
    return {
      id: sessao.id,
      clienteId: sessao.clienteId,
      estadoAtual: sessao.estadoAtual,
      estadoAnterior: sessao.estadoAnterior,
      contexto: parseContext(sessao.contexto),
      ativa: sessao.ativa,
      lembreteEnviado: sessao.lembreteEnviado,
      criadoEm: sessao.criadoEm,
      atualizadoEm: sessao.atualizadoEm,
    };
  }
}

export const stateService = new StateService();
