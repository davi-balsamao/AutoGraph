/**
 * WebhookService — Card 14/15/16/17: Fluxo Completo de Atendimento
 *
 * Pipeline:
 * 1. Verifica/cadastra cliente
 * 2. Salva mensagem do cliente (CLIENTE)
 * 3. Recupera histórico de conversa (Card 17)
 * 4. Processa com RagService + Guardrails (Card 13/18)
 * 5. Extrai entidades do pedido (Card 15)
 * 6. Se pedido completo → cria OS com AGUARDANDO_ORCAMENTO (Card 16)
 * 7. Salva resposta da IA (BOT) e envia ao cliente
 */

import { ClienteRepository } from '../repositories/cliente.repository';
import { MensagemRepository } from '../repositories/mensagem.repository';
import { OsRepository } from '../repositories/os.repository';
import { whatsappService } from './whatsapp.service';
import { ragService } from './rag.service';
import { entityExtractionService } from './entity-extraction.service';
import { conversationService } from './conversation.service';
import { WhatsAppMessageData } from '../utils/whatsapp.parser';

const clienteRepo = new ClienteRepository();
const mensagemRepo = new MensagemRepository();
const osRepo = new OsRepository();

/** Mensagem de fallback caso a IA falhe. */
const FALLBACK_MESSAGE =
  'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em instantes ou entre em contato diretamente com nossa recepcionista.';

/** Mensagem de transbordo quando OS é criada. */
const TRANSBORDO_MESSAGE =
  'Tudo anotado! Vou repassar suas informações para a nossa recepcionista. Ela vai gerar o seu orçamento e falará com você em breve. 😊';

export class WebhookService {
  /**
   * Processa uma mensagem recebida do WhatsApp.
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

      // 3. Recuperar histórico de conversa
      const conversationHistory = await conversationService.getFormattedHistory(cliente.id);
      if (conversationHistory) {
        console.log(`📜 Histórico recuperado (${conversationHistory.split('\n').length} turnos)`);
      }

      // 4. Processar com a IA (RAG + Guardrails + Histórico)
      let aiResponse: string;
      try {
        console.log(`🤖 Enviando para o RagService: "${messageData.text}"`);
        const result = await ragService.query(messageData.text, conversationHistory || undefined);
        aiResponse = result.answer;

        if (result.guardrailApplied) {
          console.warn('🛡️ Guardrail foi aplicado na resposta.');
        }
        console.log(`✅ Resposta da IA gerada (${result.sourceDocuments.length} docs usados)`);
      } catch (aiError) {
        console.error('❌ Erro no processamento da IA:', aiError);
        aiResponse = FALLBACK_MESSAGE;
      }

      // 5. Extração de Entidades, verifica se o pedido está completo
      const fullHistory = conversationHistory
        ? `${conversationHistory}\nCliente: ${messageData.text}\nAssistente: ${aiResponse}`
        : `Cliente: ${messageData.text}\nAssistente: ${aiResponse}`;

      const entities = entityExtractionService.extract(fullHistory);

      if (entities.produtoIdentificado) {
        console.log(`🔍 Produto identificado: ${entities.produtoIdentificado}`);
        console.log(`   Completo: ${entities.completo ? '✅ SIM' : `❌ NÃO (faltam ${entities.perguntasFaltantes.length})`}`);
      }

      // 6. Se pedido completo → Criar OS
      if (entities.completo && entities.produtoIdentificado) {
        console.log('🎯 Pedido completo! Criando Ordem de Serviço...');

        const especificacoes = {
          produto: entities.produtoIdentificado,
          requisitos: entities.requisitos.map((r) => ({
            pergunta: r.pergunta,
            resposta: r.resposta,
          })),
        };

        console.log('🤖 Gerando mensagem sugerida para a recepcionista...');
        const mensagemSugerida = await ragService.generateSuggestedMessage(
          cliente.nome,
          especificacoes,
          fullHistory
        );
        console.log(`📝 Mensagem gerada: "${mensagemSugerida}"`);

        const os = await osRepo.create({
          clienteId: cliente.id,
          especificacoes,
          mensagem_sugerida: mensagemSugerida,
        } as any);

        console.log(`📋 OS #${os.id} criada com status AGUARDANDO_ORCAMENTO`);

        // Sobrescrever a resposta da IA pela mensagem de transbordo
        aiResponse = TRANSBORDO_MESSAGE;

        // TODO: Enviar notificação push (FCM) para a recepcionista
        console.log('🔔 [TODO] Notificar recepcionista via FCM/Socket');
      }

      // 7. Salvar a resposta da IA no banco (origem: BOT)
      await mensagemRepo.create({
        usuarioId: cliente.id,
        payload: { text: aiResponse },
        origem: 'BOT',
      });
      console.log(`💾 Resposta da IA salva no banco.`);

      // 8. Enviar a resposta ao cliente via WhatsApp
      await whatsappService.sendMessage(messageData.from, aiResponse);
    } catch (error) {
      console.error('❌ Erro ao processar mensagem do webhook:', error);

      try {
        await whatsappService.sendMessage(messageData.from, FALLBACK_MESSAGE);
      } catch (fallbackError) {
        console.error('❌ Falha ao enviar mensagem de fallback:', fallbackError);
      }
    }
  }
}

export const webhookService = new WebhookService();