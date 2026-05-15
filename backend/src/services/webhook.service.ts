import { ClienteRepository } from '../repositories/cliente.repository';
import { MensagemRepository } from '../repositories/mensagem.repository';
import { whatsappService } from './whatsapp.service';
import { ragService } from './rag.service';
import { entityExtractionService } from './entity-extraction.service';
import { conversationService } from './conversation.service';
import { stateService } from './state.service';
import { stateRouter } from '../fsm/state-router';
import { WhatsAppMessageData } from '../utils/whatsapp.parser';
import { io } from '../server';
import dotenv from 'dotenv';

dotenv.config();

const clienteRepo = new ClienteRepository();
const mensagemRepo = new MensagemRepository();

const FALLBACK_MESSAGE = 'Desculpe, estou com dificuldades técnicas no momento.';
const FSM_ENABLED = process.env.FSM_ENABLED !== 'false';

export class WebhookService {
  async processIncomingMessage(messageData: WhatsAppMessageData): Promise<void> {
    try {
      let cliente = await clienteRepo.findByPhone(messageData.from);
      if (!cliente) {
        cliente = await clienteRepo.create({
          nome: messageData.contactName || 'Cliente WhatsApp',
          telefone: messageData.from,
        });
      }

      const msgCliente = await mensagemRepo.create({
        usuarioId: cliente.id,
        payload: messageData.rawPayload,
        origem: 'CLIENTE',
      });

      io.emit(`chat-${cliente.id}`, {
        id: msgCliente.id,
        origem: 'CLIENTE',
        texto: messageData.text,
        criadoEm: msgCliente.criadoEm,
      });

      if (cliente.atendimentoHumano) {
        console.log(`🤫 IA Silenciada: Atendimento manual ativo para ${cliente.nome}`);
        return;
      }

      let aiResponse: string;

      if (FSM_ENABLED) {
        aiResponse = await this.processWithFsm(cliente.id, cliente.nome, messageData);
      } else {
        aiResponse = await this.processLegacy(cliente.id, messageData.text);
      }

      const msgBot = await mensagemRepo.create({
        usuarioId: cliente.id,
        payload: { text: aiResponse },
        origem: 'BOT',
      });

      io.emit(`chat-${cliente.id}`, {
        id: msgBot.id,
        origem: 'BOT',
        texto: aiResponse,
        criadoEm: msgBot.criadoEm,
      });

      console.log(`📤 Enviando resposta para ${messageData.from}...`);
      await whatsappService.sendMessage(messageData.from, aiResponse);
    } catch (error) {
      console.error('❌ Erro no webhook:', error);
    }
  }

  private async processWithFsm(
    clienteId: string,
    clienteNome: string,
    messageData: WhatsAppMessageData
  ): Promise<string> {
    try {
      const sessao = await stateService.getOrCreateSession(clienteId);
      console.log(`🔀 FSM — Estado: ${sessao.estadoAtual} | Sessão: ${sessao.id}`);

      const result = await stateRouter.route(
        sessao,
        messageData.text,
        clienteNome,
        messageData.from
      );

      if (result.gerouOs) {
        console.log(`📋 OS gerada via FSM: ${result.osMeta?.id}`);
      }
      if (result.escalarHumano) {
        console.log(`👤 Atendimento humano ativado para ${clienteNome}`);
      }

      console.log(`💬 Resposta da IA (FSM → ${result.sessao.estadoAtual}): "${result.response}"`);
      return result.response;
    } catch (error) {
      console.error('❌ Erro na FSM:', error);
      return FALLBACK_MESSAGE;
    }
  }

  private async processLegacy(clienteId: string, text: string): Promise<string> {
    const TRANSBORDO_MESSAGE =
      'Tudo anotado! Vou repassar suas informações para a nossa recepcionista. 😊';

    const conversationHistory = await conversationService.getFormattedHistory(clienteId);
    let aiResponse: string;

    try {
      const result = await ragService.query(text, conversationHistory || undefined);
      aiResponse = result.answer;
    } catch {
      return FALLBACK_MESSAGE;
    }

    const linhasCliente = (conversationHistory || '')
      .split('\n')
      .filter((linha) => linha.startsWith('Cliente:'))
      .join('\n');
    const textoParaExtracao = `${linhasCliente}\nCliente: ${text}`;
    const entities = entityExtractionService.extract(textoParaExtracao);

    if (entities.completo && entities.produtoIdentificado) {
      const cliente = await clienteRepo.findById(clienteId);
      const especificacoes = {
        produto: entities.produtoIdentificado,
        requisitos: entities.requisitos.map((r) => ({
          pergunta: r.pergunta,
          resposta: r.resposta,
        })),
      };

      const mensagemSugerida = await ragService.generateSuggestedMessage(
        cliente?.nome || 'Cliente',
        especificacoes,
        textoParaExtracao
      );

      const { OsRepository } = await import('../repositories/os.repository');
      const osRepo = new OsRepository();
      const os = await osRepo.create({
        clienteId,
        especificacoes,
        mensagem_sugerida: mensagemSugerida,
      } as Parameters<typeof osRepo.create>[0]);

      io.emit('nova-os', {
        id: os.id,
        cliente: cliente?.nome,
        produto: entities.produtoIdentificado,
      });
      aiResponse = TRANSBORDO_MESSAGE;
    }

    return aiResponse;
  }
}

export const webhookService = new WebhookService();
