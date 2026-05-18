import { ClienteRepository } from '../repositories/cliente.repository';
import { MensagemRepository } from '../repositories/mensagem.repository';
import { OsRepository } from '../repositories/os.repository'; // Import unificado
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

const FALLBACK_MESSAGE = 'Desculpe, estou com dificuldades técnicas no momento. Nossa equipe humana assumirá em breve.';
const FSM_ENABLED = process.env.FSM_ENABLED !== 'false';

// Simulador local de contingência (Fallback para limite de cota do Gemini)
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

      // Emissão Socket unificada (Contrato Flutter da branch develop)
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

      // Roteamento de arquitetura (Branch fix/rag-tests)
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

      // Emissão Socket da Resposta (Contrato Flutter da branch develop)
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

  private async processWithFsm(clienteId: string, clienteNome: string, messageData: WhatsAppMessageData): Promise<string> {
    try {
      const sessao = await stateService.getOrCreateSession(clienteId);
      console.log(`🔀 FSM — Estado: ${sessao.estadoAtual} | Sessão: ${sessao.id}`);

      const result = await stateRouter.route(sessao, messageData.text, clienteNome, messageData.from);

      if (result.gerouOs) console.log(`📋 OS gerada via FSM: ${result.osMeta?.id}`);
      if (result.escalarHumano) console.log(`👤 Atendimento humano ativado para ${clienteNome}`);

      return result.response;
    } catch (error) {
      console.error('❌ Erro na FSM. Ativando Fallback local:', error);
      return obterRespostaSimulada(messageData.text); // Integração da contingência na FSM
    }
  }

  private async processLegacy(clienteId: string, text: string): Promise<string> {
    const TRANSBORDO_MESSAGE = 'Tudo anotado! Vou repassar suas informações para a nossa recepcionista. 😊';
    const conversationHistory = await conversationService.getFormattedHistory(clienteId);
    let aiResponse: string;

    try {
      const result = await ragService.query(text, conversationHistory || undefined);
      aiResponse = result.answer;
      console.log(`✅ Resposta da IA gerada com sucesso.`);
    } catch (error) {
      console.warn('⚠️ Cota da API esgotada ou erro no RAG. Ativando assistente local de contingência...');
      aiResponse = obterRespostaSimulada(text); // Integração da contingência no Legacy
    }

    const linhasCliente = (conversationHistory || '').split('\n').filter((linha) => linha.startsWith('Cliente:')).join('\n');
    const textoParaExtracao = `${linhasCliente}\nCliente: ${text}`;
    const entities = await entityExtractionService.extract(textoParaExtracao);

    // Lógica de OS (Combinada das duas branches)
    if (entities.completo && entities.produtoIdentificado) {
      const cliente = await clienteRepo.findById(clienteId);
      const especificacoes = {
        produto: entities.produtoIdentificado,
        requisitos: entities.requisitos.map((r) => ({ pergunta: r.pergunta, resposta: r.resposta || r.response })),
      };

      const osRepo = new OsRepository();
      const os = await osRepo.create({
        clienteId,
        especificacoes,
        mensagem_sugerida: "Orçamento solicitado via assistente virtual.",
      } as any);

      io.emit('nova-os', { id: os.id, cliente: cliente?.nome, produto: entities.produtoIdentificado });
      aiResponse = TRANSBORDO_MESSAGE;
    }

    return aiResponse;
  }
}

export const webhookService = new WebhookService();