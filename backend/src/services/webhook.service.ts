import { ClienteRepository } from '../repositories/cliente.repository';
import { MensagemRepository } from '../repositories/mensagem.repository';
import { whatsappService } from './whatsapp.service';
import { WhatsAppMessageData } from '../utils/whatsapp.parser';

const clienteRepo = new ClienteRepository();
const mensagemRepo = new MensagemRepository();

export class WebhookService {
  /**
   * Processa uma mensagem recebida do WhatsApp.
   * 1. Verifica/cadastra o cliente pelo telefone
   * 2. Salva a mensagem no banco
   * 3. Envia resposta automática (echo)
   */
  async processIncomingMessage(messageData: WhatsAppMessageData): Promise<void> {
    try {
      // 1. Verifica se o cliente já existe, senão cadastra
      let cliente = await clienteRepo.findByPhone(messageData.from);

      if (!cliente) {
        console.log(`🆕 Novo cliente detectado: ${messageData.contactName} (${messageData.from})`);
        cliente = await clienteRepo.create({
          nome: messageData.contactName || 'Cliente WhatsApp',
          telefone: messageData.from,
        });
      }

      // 2. Salva a mensagem no banco
      await mensagemRepo.create({
        usuarioId: cliente.id,
        payload: messageData.rawPayload,
        origem: 'CLIENTE',
      });
      console.log(`💾 Mensagem salva no banco para o cliente ${cliente.nome}`);

      // 3. Envia resposta automática (echo) — Card 8
      await whatsappService.sendMessage(
        messageData.from,
        'Sua mensagem foi recebida e registrada! Em breve nossa inteligência artificial responderá.'
      );
    } catch (error) {
      console.error('❌ Erro ao processar mensagem do webhook:', error);
    }
  }
}

export const webhookService = new WebhookService();
