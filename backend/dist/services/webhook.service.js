"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookService = exports.WebhookService = void 0;
const cliente_repository_1 = require("../repositories/cliente.repository");
const mensagem_repository_1 = require("../repositories/mensagem.repository");
const os_repository_1 = require("../repositories/os.repository");
const whatsapp_service_1 = require("./whatsapp.service");
const rag_service_1 = require("./rag.service");
const entity_extraction_service_1 = require("./entity-extraction.service");
const conversation_service_1 = require("./conversation.service");
const clienteRepo = new cliente_repository_1.ClienteRepository();
const mensagemRepo = new mensagem_repository_1.MensagemRepository();
const osRepo = new os_repository_1.OsRepository();
/** Mensagem de fallback caso a IA falhe. */
const FALLBACK_MESSAGE = 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em instantes ou entre em contato diretamente com nossa recepcionista.';
/** Mensagem de transbordo quando OS é criada. */
const TRANSBORDO_MESSAGE = 'Tudo anotado! Vou repassar suas informações para a nossa recepcionista. Ela vai gerar o seu orçamento e falará com você em breve. 😊';
class WebhookService {
    /**
     * Processa uma mensagem recebida do WhatsApp.
     */
    async processIncomingMessage(messageData) {
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
            const conversationHistory = await conversation_service_1.conversationService.getFormattedHistory(cliente.id);
            if (conversationHistory) {
                console.log(`📜 Histórico recuperado (${conversationHistory.split('\n').length} turnos)`);
            }
            // 4. Processar com a IA (RAG + Guardrails + Histórico)
            let aiResponse;
            try {
                console.log(`🤖 Enviando para o RagService: "${messageData.text}"`);
                const result = await rag_service_1.ragService.query(messageData.text, conversationHistory || undefined);
                aiResponse = result.answer;
                if (result.guardrailApplied) {
                    console.warn('🛡️ Guardrail foi aplicado na resposta.');
                }
                console.log(`✅ Resposta da IA gerada (${result.sourceDocuments.length} docs usados)`);
            }
            catch (aiError) {
                console.error('❌ Erro no processamento da IA:', aiError);
                aiResponse = FALLBACK_MESSAGE;
            }
            // 5. Extração de Entidades, verifica se o pedido está completo
            const fullHistory = conversationHistory
                ? `${conversationHistory}\nCliente: ${messageData.text}\nAssistente: ${aiResponse}`
                : `Cliente: ${messageData.text}\nAssistente: ${aiResponse}`;
            const entities = entity_extraction_service_1.entityExtractionService.extract(fullHistory);
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
                const mensagemSugerida = await rag_service_1.ragService.generateSuggestedMessage(cliente.nome, especificacoes, fullHistory);
                console.log(`📝 Mensagem gerada: "${mensagemSugerida}"`);
                const os = await osRepo.create({
                    clienteId: cliente.id,
                    especificacoes,
                    mensagem_sugerida: mensagemSugerida,
                });
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
            await whatsapp_service_1.whatsappService.sendMessage(messageData.from, aiResponse);
        }
        catch (error) {
            console.error('❌ Erro ao processar mensagem do webhook:', error);
            try {
                await whatsapp_service_1.whatsappService.sendMessage(messageData.from, FALLBACK_MESSAGE);
            }
            catch (fallbackError) {
                console.error('❌ Falha ao enviar mensagem de fallback:', fallbackError);
            }
        }
    }
}
exports.WebhookService = WebhookService;
exports.webhookService = new WebhookService();
