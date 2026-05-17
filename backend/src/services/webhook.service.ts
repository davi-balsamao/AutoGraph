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

// Simulador local inteligente caso a cota do Gemini acabe
function obterRespostaSimulada(pergunta: string): string {
  const p = pergunta.toLowerCase();
  if (p.includes('gostaria') || p.includes('quero') || p.includes('fazer')) {
    return "Com certeza! A AutoGraph faz cartões de visita de alta qualidade. Qual a quantidade e tipo de papel você tem em mente? Você já possui a arte pronta?";
  }
  if (p.includes('papel') || p.includes('arte') || p.includes('cartao') || p.includes('100')) {
    return "Excelente! Qual seria o tamanho do cartão (ex: 5x3cm) e você precisa de algum acabamento especial como laminação ou verniz?";
  }
  if (p.includes('tamanho') || p.includes('5x3') || p.includes('sem')) {
    return "Perfeito! Com essas especificações nossa equipe consegue calcular o seu orçamento. Posso encaminhar os dados para eles?";
  }
  if (p.includes('sim') || p.includes('pode')) {
    return "Tudo anotado! Estou encaminhando as especificações para a nossa equipe de orçamentos. Entraremos em contato em breve! 😊";
  }
  return "Boa tarde! A AutoGraph agradece o seu contato. Como posso te ajudar com seus materiais impressos hoje?";
}

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

      // Transmite a mensagem do cliente para o Socket usando o telefone estável
      console.log(`🔌 [SOCKET BACKEND] Emitindo mensagem do telefone: ${messageData.from}`);
      io.emit('message', {
        id: msgCliente.id.toString(),
        senderId: messageData.from,
        receiverId: 'admin',
        text: messageData.text,
        type: 'text',
        timestamp: new Date().toISOString(),
        isFromRAG: false
      });

      if (cliente.atendimentoHumano) {
        console.log(`🤫 Atendimento manual ativo para ${cliente.nome}`);
        return;
      }

      const conversationHistory = await conversationService.getFormattedHistory(cliente.id);

      let aiResponse: string;
      try {
        const result = await ragService.query(messageData.text, conversationHistory || undefined);
        aiResponse = result.answer;
        console.log(`✅ Resposta da IA gerada com sucesso.`);
      } catch (aiError) {
        // 🔥 CRUCIAL: Ativa o simulador local caso a cota do Gemini expire (Erro 429)
        console.warn('⚠️ Cota da API esgotada ou expirada. Ativando assistente local de contingência...');
        aiResponse = obterRespostaSimulada(messageData.text);
      }

      // Extração de entidades e criação de OS
      const linesCliente = (conversationHistory || '').split('\n').filter((l) => l.startsWith('Cliente:')).join('\n');
      const entities = entityExtractionService.extract(`${linesCliente}\nCliente: ${messageData.text}`);

      if (entities.completo && entities.produtoIdentificado) {
        const especificacoes = {
          produto: entities.produtoIdentificado,
          requisitos: entities.requisitos.map((r) => ({ pergunta: r.pergunta, response: r.resposta })),
        };

        const os = await osRepo.create({
          clienteId: cliente.id,
          especificacoes,
          mensagem_sugerida: "Orçamento solicitado via assistente virtual.",
        } as any);

        io.emit('nova-os', { id: os.id, cliente: cliente.nome, produto: entities.produtoIdentificado });
        aiResponse = "Tudo anotado! Vou repassar as informações do seu cartão para a nossa equipe de orçamentos. 😊";
      }

      const msgBot = await mensagemRepo.create({
        usuarioId: cliente.id,
        payload: { text: aiResponse },
        origem: 'BOT',
      });

      // Transmite a resposta da IA/Simulador para o Socket do Flutter
      io.emit('message', {
        id: msgBot.id.toString(),
        senderId: 'bot',
        receiverId: messageData.from,
        text: aiResponse,
        type: 'text',
        timestamp: new Date().toISOString(),
        isFromRAG: true
      });

      console.log(`📤 Enviando resposta para o WhatsApp: ${messageData.from}`);
      await whatsappService.sendMessage(messageData.from, aiResponse);

    } catch (error) {
      console.error('❌ Erro no webhook:', error);
    }
  }
}

export const webhookService = new WebhookService();