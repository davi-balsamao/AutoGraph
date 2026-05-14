import { ClienteRepository } from '../repositories/cliente.repository';
import { MensagemRepository } from '../repositories/mensagem.repository';
import { OsRepository } from '../repositories/os.repository';
import { whatsappService } from './whatsapp.service';
import { ragService } from './rag.service';
import { entityExtractionService } from './entity-extraction.service';
import { conversationService } from './conversation.service';
import { WhatsAppMessageData } from '../utils/whatsapp.parser';
import { io } from '../server';

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

        if (result.guardrailApplied) {
          console.warn('🛡️ Guardrail foi aplicado na resposta.');
        }
        console.log(`✅ Resposta da IA gerada (${result.sourceDocuments.length} docs usados)`);
        console.log(`💬 Resposta: "${aiResponse}"`);

      } catch (aiError) {
        aiResponse = FALLBACK_MESSAGE;
      }

      // 5. Extração de Entidades — apenas nas falas do CLIENTE, nunca nas da IA
      // (a IA pode mencionar "10x14cm" como sugestão → não pode ser confundido com resposta do cliente)
      const linhasCliente = (conversationHistory || '')
        .split('\n')
        .filter((linha) => linha.startsWith('Cliente:'))
        .join('\n');
      const textoParaExtracao = `${linhasCliente}\nCliente: ${messageData.text}`;

      const entities = entityExtractionService.extract(textoParaExtracao);

      if (entities.completo && entities.produtoIdentificado) {
        const especificacoes = {
          produto: entities.produtoIdentificado,
          requisitos: entities.requisitos.map((r) => ({ pergunta: r.pergunta, resposta: r.resposta })),
        };

        console.log('🤖 Gerando mensagem sugerida para a recepcionista...');
        const mensagemSugerida = await ragService.generateSuggestedMessage(
          cliente.nome,
          especificacoes,
          textoParaExtracao
        );
        console.log(`📝 Mensagem gerada: "${mensagemSugerida}"`);

        const os = await osRepo.create({
          clienteId: cliente.id,
          especificacoes,
          mensagem_sugerida: mensagemSugerida,
        } as any);

        io.emit('nova-os', { id: os.id, cliente: cliente.nome, produto: entities.produtoIdentificado });
        aiResponse = TRANSBORDO_MESSAGE;
      }

      const msgBot = await mensagemRepo.create({
        usuarioId: cliente.id,
        payload: { text: aiResponse },
        origem: 'BOT',
      });

      // 8. Enviar a resposta ao cliente via WhatsApp
      console.log(`📤 Enviando resposta para ${messageData.from}...`);
      await whatsappService.sendMessage(messageData.from, aiResponse);

    } catch (error) {
      console.error('❌ Erro no webhook:', error);
    }
  }
}

export const webhookService = new WebhookService();