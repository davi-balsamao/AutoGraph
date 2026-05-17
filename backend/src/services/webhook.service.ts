import { ClienteRepository } from '../repositories/cliente.repository';
import { MensagemRepository } from '../repositories/mensagem.repository';
import { OsRepository } from '../repositories/os.repository';
import { whatsappService } from './whatsapp.service';
import { ragService } from './rag.service';
import { entityExtractionService } from './entity-extraction.service';
import { conversationService } from './conversation.service';
import { WhatsAppMessageData } from '../utils/whatsapp.parser';
import { io } from '../server';
import { notificationService } from './notification.service';

const clienteRepo = new ClienteRepository();
const mensagemRepo = new MensagemRepository();
const osRepo = new OsRepository();

const FALLBACK_MESSAGE = 'Desculpe, estou com dificuldades técnicas no momento.';
const TRANSBORDO_MESSAGE = 'Tudo anotado! Vou repassar suas informações para a nossa recepcionista. 😊';

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

      // 1. Salva mensagem do cliente e avisa o Admin via Socket
      const msgCliente = await mensagemRepo.create({
        usuarioId: cliente.id,
        payload: messageData.rawPayload,
        origem: 'CLIENTE',
      });

      io.emit(`chat-${cliente.id}`, {
        id: msgCliente.id,
        origem: 'CLIENTE',
        texto: messageData.text,
        criadoEm: msgCliente.criadoEm
      });

      // Notificar administradores por push (FCM)
      notificationService.sendToAdmins(
        'Mensagem de Cliente 💬',
        `${cliente.nome}: "${messageData.text.length > 50 ? messageData.text.substring(0, 50) + '...' : messageData.text}"`,
        { clienteId: cliente.id, type: 'chat_message' }
      ).catch(err => console.error('❌ Erro ao enviar push de chat:', err));

      // 🛡️ CEREJA DO BOLO: Se o atendimento humano estiver ativo, encerramos aqui
      if (cliente.atendimentoHumano) {
        console.log(`🤫 IA Silenciada: Atendimento manual ativo para ${cliente.nome}`);
        return;
      }

      const conversationHistory = await conversationService.getFormattedHistory(cliente.id);

      let aiResponse: string;
      try {
        const result = await ragService.query(messageData.text, conversationHistory || undefined);
        aiResponse = result.answer;
      } catch (aiError) {
        aiResponse = FALLBACK_MESSAGE;
      }

      const fullHistory = conversationHistory
        ? `${conversationHistory}\nCliente: ${messageData.text}\nAssistente: ${aiResponse}`
        : `Cliente: ${messageData.text}\nAssistente: ${aiResponse}`;

      const entities = entityExtractionService.extract(fullHistory);

      if (entities.completo && entities.produtoIdentificado) {
        const especificacoes = {
          produto: entities.produtoIdentificado,
          requisitos: entities.requisitos.map((r) => ({ pergunta: r.pergunta, resposta: r.resposta })),
        };

        const mensagemSugerida = await ragService.generateSuggestedMessage(cliente.nome, especificacoes, fullHistory);

        const os = await osRepo.create({
          clienteId: cliente.id,
          especificacoes,
          mensagem_sugerida: mensagemSugerida,
        } as any);

        io.emit('nova-os', { id: os.id, cliente: cliente.nome, produto: entities.produtoIdentificado });
        
        // Notificar administradores por push (FCM)
        notificationService.sendToAdmins(
          'Novo Pedido Automático 📋',
          `Cliente ${cliente.nome} solicitou "${entities.produtoIdentificado}" via assistente virtual.`,
          { osId: os.id, type: 'new_os' }
        ).catch(err => console.error('❌ Erro ao enviar push de OS automática:', err));

        aiResponse = TRANSBORDO_MESSAGE;
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
        criadoEm: msgBot.criadoEm
      });

      await whatsappService.sendMessage(messageData.from, aiResponse);
    } catch (error) {
      console.error('❌ Erro no webhook:', error);
    }
  }
}

export const webhookService = new WebhookService();