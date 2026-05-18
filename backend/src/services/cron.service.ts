import cron from 'node-cron';
import { sessaoRepository } from '../repositories/sessao.repository';
import { stateService } from './state.service';
import { whatsappService } from './whatsapp.service';
import { ConversationState } from '../fsm/states';

const LEMBRETE_MINUTOS = parseInt(process.env.FSM_LEMBRETE_MINUTOS || '30', 10);
const ENCERRAR_MINUTOS = parseInt(process.env.FSM_ENCERRAR_MINUTOS || '1440', 10);

const LEMBRETE_MSG =
  'Oi! Vi que nossa conversa ficou parada. Ainda posso te ajudar com o orçamento?';
const ENCERRAR_MSG =
  'Como não tive retorno, vou encerrar este atendimento por aqui. Quando quiser, é só mandar uma mensagem que começamos de novo!';

export class CronService {
  start(): void {
    cron.schedule('*/5 * * * *', () => {
      this.processInatividade().catch((err) =>
        console.error('❌ [Cron] Erro ao processar inatividade:', err)
      );
    });
    console.log('⏰ [Cron] Scheduler de inatividade ativo (a cada 5 min)');
  }

  private async processInatividade(): Promise<void> {
    const sessoes = await sessaoRepository.findAguardandoRetornoInativas(LEMBRETE_MINUTOS);

    for (const sessao of sessoes) {
      const minutos =
        (Date.now() - sessao.atualizadoEm.getTime()) / (60 * 1000);

      if (minutos >= ENCERRAR_MINUTOS) {
        await whatsappService.sendMessage(sessao.cliente.telefone, ENCERRAR_MSG);
        await stateService.transition(
          sessao.id,
          ConversationState.ENCERRAR,
          (sessao.contexto as object) || {}
        );
        await sessaoRepository.encerrar(sessao.id);
        console.log(`⏰ [Cron] Sessão ${sessao.id} encerrada por inatividade (24h)`);
        continue;
      }

      if (!sessao.lembreteEnviado && minutos >= LEMBRETE_MINUTOS) {
        await whatsappService.sendMessage(sessao.cliente.telefone, LEMBRETE_MSG);
        await sessaoRepository.setLembreteEnviado(sessao.id, true);
        console.log(`⏰ [Cron] Lembrete enviado — sessão ${sessao.id}`);
      }
    }

    await this.marcarAguardarRetornoInativos();
  }

  /** Sessões ativas sem resposta recente entram em AGUARDAR_RETORNO */
  private async marcarAguardarRetornoInativos(): Promise<void> {
    const limite = new Date(Date.now() - LEMBRETE_MINUTOS * 60 * 1000);
    const { prisma } = await import('../config/prisma');

    const candidatas = await prisma.sessaoAtendimento.findMany({
      where: {
        ativa: true,
        estadoAtual: {
          notIn: [
            ConversationState.ENCERRAR,
            ConversationState.AGUARDAR_RETORNO,
            ConversationState.ESCALAR_HUMANO,
            ConversationState.BOAS_VINDAS,
          ],
        },
        atualizadoEm: { lt: limite },
      },
    });

    for (const s of candidatas) {
      await stateService.transition(
        s.id,
        ConversationState.AGUARDAR_RETORNO,
        (s.contexto as object) || {},
        { previousState: s.estadoAtual }
      );
    }
  }
}

export const cronService = new CronService();
