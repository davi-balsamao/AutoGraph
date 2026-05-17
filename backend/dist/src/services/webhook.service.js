"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookService = exports.WebhookService = void 0;
const cliente_repository_1 = require("../repositories/cliente.repository");
const mensagem_repository_1 = require("../repositories/mensagem.repository");
const os_repository_1 = require("../repositories/os.repository");
const whatsapp_service_1 = require("./whatsapp.service");
const rag_service_1 = require("./rag.service");
const entity_extraction_service_1 = require("./entity-extraction.service");
const conversation_service_1 = require("./conversation.service");
const server_1 = require("../server");
const clienteRepo = new cliente_repository_1.ClienteRepository();
const mensagemRepo = new mensagem_repository_1.MensagemRepository();
const osRepo = new os_repository_1.OsRepository();
const FALLBACK_MESSAGE = 'Desculpe, estou com dificuldades técnicas no momento.';
const TRANSBORDO_MESSAGE = 'Tudo anotado! Vou repassar suas informações para a nossa recepcionista. 😊';
class WebhookService {
    async processIncomingMessage(messageData) {
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
            server_1.io.emit(`chat-${cliente.id}`, {
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
            const conversationHistory = await conversation_service_1.conversationService.getFormattedHistory(cliente.id);
            let aiResponse;
            try {
                const result = await rag_service_1.ragService.query(messageData.text, conversationHistory || undefined);
                aiResponse = result.answer;
            }
            catch (aiError) {
                aiResponse = FALLBACK_MESSAGE;
            }
            const fullHistory = conversationHistory
                ? `${conversationHistory}\nCliente: ${messageData.text}\nAssistente: ${aiResponse}`
                : `Cliente: ${messageData.text}\nAssistente: ${aiResponse}`;
            const entities = entity_extraction_service_1.entityExtractionService.extract(fullHistory);
            if (entities.completo && entities.produtoIdentificado) {
                const especificacoes = {
                    produto: entities.produtoIdentificado,
                    requisitos: entities.requisitos.map((r) => ({ pergunta: r.pergunta, resposta: r.resposta })),
                };
                const mensagemSugerida = await rag_service_1.ragService.generateSuggestedMessage(cliente.nome, especificacoes, fullHistory);
                const os = await osRepo.create({
                    clienteId: cliente.id,
                    especificacoes,
                    mensagem_sugerida: mensagemSugerida,
                });
                server_1.io.emit('nova-os', { id: os.id, cliente: cliente.nome, produto: entities.produtoIdentificado });
                aiResponse = TRANSBORDO_MESSAGE;
            }
            const msgBot = await mensagemRepo.create({
                usuarioId: cliente.id,
                payload: { text: aiResponse },
                origem: 'BOT',
            });
            server_1.io.emit(`chat-${cliente.id}`, {
                id: msgBot.id,
                origem: 'BOT',
                texto: aiResponse,
                criadoEm: msgBot.criadoEm
            });
            await whatsapp_service_1.whatsappService.sendMessage(messageData.from, aiResponse);
        }
        catch (error) {
            console.error('❌ Erro no webhook:', error);
        }
    }
}
exports.WebhookService = WebhookService;
exports.webhookService = new WebhookService();
