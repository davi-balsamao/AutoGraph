import { ClienteRepository } from '../repositories/cliente.repository';
import { MensagemRepository } from '../repositories/mensagem.repository';
import { whatsappService } from './whatsapp.service';
import { ragService } from './rag.service';
import { WhatsAppMessageData } from '../utils/whatsapp.parser';

const clienteRepo = new ClienteRepository();
const mensagemRepo = new MensagemRepository();

/** Mensagem de fallback caso a IA falhe. */
const FALLBACK_MESSAGE =
  'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em instantes ou entre em contato diretamente com nossa recepcionista.';

export class WebhookService {
  /**
   * Processa uma mensagem recebida do WhatsApp.
   *
   * Fluxo (Card 14):
   * 1. Verifica/cadastra o cliente pelo telefone
   * 2. Salva a mensagem do cliente no banco (origem: CLIENTE)
   * 3. Envia a mensagem para o RagService (pipeline RAG + Guardrails)
   * 4. Salva a resposta da IA no banco (origem: BOT)
   * 5. Envia a resposta ao cliente via WhatsApp
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

      // 2. Salva a mensagem do cliente no banco
      await mensagemRepo.create({
        usuarioId: cliente.id,
        payload: messageData.rawPayload,
        origem: 'CLIENTE',
      });
      console.log(`💾 Mensagem salva no banco para o cliente ${cliente.nome}`);

      // 3. Processa a mensagem com a IA (RAG + Guardrails)
      let aiResponse: string;
      try {
        console.log(`🤖 Enviando para o RagService: "${messageData.text}"`);
        const result = await ragService.query(messageData.text);
        aiResponse = result.answer;

        if (result.guardrailApplied) {
          console.warn('🛡️ Guardrail foi aplicado na resposta.');
        }

        console.log(`✅ Resposta da IA gerada (${result.sourceDocuments.length} docs usados)`);
      } catch (aiError) {
        console.error('❌ Erro no processamento da IA:', aiError);
        aiResponse = FALLBACK_MESSAGE;
      }

      // 4. Salva a resposta da IA no banco (origem: BOT)
      await mensagemRepo.create({
        usuarioId: cliente.id,
        payload: { text: aiResponse },
        origem: 'BOT',
      });
      console.log(`💾 Resposta da IA salva no banco.`);

      // 5. Envia a resposta ao cliente via WhatsApp
      await whatsappService.sendMessage(messageData.from, aiResponse);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem do webhook:', error);

      // Tenta enviar fallback ao cliente mesmo em caso de erro geral
      try {
        await whatsappService.sendMessage(messageData.from, FALLBACK_MESSAGE);
      } catch (fallbackError) {
        console.error('❌ Falha ao enviar mensagem de fallback:', fallbackError);
      }
    }
  }
}

export const webhookService = new WebhookService();
