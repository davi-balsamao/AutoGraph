import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import {
  ConversationContext,
  ConversationState,
  PropostaPendente,
  SessaoRecord,
} from '../states';
import { io } from '../../server';
import { notificationService } from '../../services/notification.service';
import { OsRepository } from '../../repositories/os.repository';
import { StatusOS } from '@prisma/client';

const osRepo = new OsRepository();

const MENSAGEM_ESPERA =
  'Estou revisando seu orçamento e já te retorno por aqui em instantes.';

function montarPropostaPendente(context: ConversationContext): PropostaPendente {
  const orcamento = context.orcamento ?? {
    total: 0,
    prazo: '3 dias úteis',
    validade: '3 dias úteis',
  };
  const requisitos = Object.entries(context.specs || {}).map(([pergunta, resposta]) => ({
    pergunta,
    resposta,
  }));

  return {
    especificacoes: {
      produto: context.produto || 'Produto não informado',
      requisitos,
      orcamento,
    },
    orcamento,
    criadoEm: new Date().toISOString(),
  };
}

export class AguardarAprovacaoAdminHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const context: ConversationContext = { ...sessao.contexto };
    const jaTemProposta = !!context.propostaPendente;

    // Primeira entrada nesse estado (chain a partir de CALCULAR_ORCAMENTO):
    // monta a proposta, persiste no contexto, emite Socket + FCM, e pausa
    // sem mandar mensagem pro cliente.
    if (!jaTemProposta) {
      const proposta = montarPropostaPendente(context);
      context.propostaPendente = proposta;
      context.aguardandoFollowupEnviado = false;

      console.log(
        `🧾 [APROVACAO-ADMIN] Proposta criada — sessao=${sessao.id} cliente=${deps.clienteNome} produto=${proposta.especificacoes.produto} total=R$ ${proposta.orcamento.total.toFixed(2)}`
      );

      io.emit('proposta-pendente', {
        sessaoId: sessao.id,
        clienteId: sessao.clienteId,
        clienteNome: deps.clienteNome,
        clienteTelefone: deps.clienteTelefone,
        proposta,
      });
      console.log(`📢 [SOCKET] emit 'proposta-pendente' enviado.`);

      // Idempotência: se já existir OS associada à sessão e ainda estiver em
      // AGUARDANDO_ORCAMENTO, reusa em vez de criar duplicata.
      let osId = context.osId;
      if (osId) {
        const existente = await osRepo.findById(osId);
        if (existente?.status !== StatusOS.AGUARDANDO_ORCAMENTO) osId = undefined;
      }
      if (!osId) {
        const novaOs = await osRepo.create({
          clienteId: sessao.clienteId,
          status: StatusOS.AGUARDANDO_ORCAMENTO,
          especificacoes: {
            produto: proposta.especificacoes.produto,
            requisitos: proposta.especificacoes.requisitos,
            orcamento: proposta.orcamento,
          },
        });
        osId = novaOs.id;
        io.emit('os-nova', novaOs);
        console.log(`📋 [KANBAN] OS ${osId.slice(0, 8)} criada — aguardando aprovação admin.`);
      } else {
        console.log(`📋 [KANBAN] OS ${osId.slice(0, 8)} já existe — reusando (idempotência).`);
      }
      context.osId = osId;

      notificationService
        .sendToAdmins(
          'Orçamento aguardando aprovação 🧾',
          `${deps.clienteNome}: ${proposta.especificacoes.produto} — R$ ${proposta.orcamento.total
            .toFixed(2)
            .replace('.', ',')}`,
          { sessaoId: sessao.id, type: 'PROPOSTA_PENDENTE' }
        )
        .then((sentCount) =>
          console.log(`📨 [FCM] Push enviado para ${sentCount} admin(s).`)
        )
        .catch((err) =>
          console.error('❌ Erro ao enviar push de proposta pendente:', err)
        );

      return {
        response: '',
        nextState: ConversationState.AGUARDAR_APROVACAO_ADMIN,
        updatedContext: context,
      };
    }

    // Cliente mandou follow-up enquanto admin não decidiu.
    // Manda 1x a mensagem de espera; depois fica em silêncio.
    if (message?.trim() && !context.aguardandoFollowupEnviado) {
      context.aguardandoFollowupEnviado = true;
      return {
        response: MENSAGEM_ESPERA,
        nextState: ConversationState.AGUARDAR_APROVACAO_ADMIN,
        updatedContext: context,
      };
    }

    return {
      response: '',
      nextState: ConversationState.AGUARDAR_APROVACAO_ADMIN,
      updatedContext: context,
    };
  }
}

export const aguardarAprovacaoAdminHandler = new AguardarAprovacaoAdminHandler();
