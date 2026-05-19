"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const whatsapp_parser_1 = require("../utils/whatsapp.parser");
const webhook_service_1 = require("../services/webhook.service");
/**
 * Cache de messageIds já processados (deduplicação de retries da Meta).
 * TTL de 5 minutos — suficiente para cobrir todos os retries da Meta.
 */
const processedMessageIds = new Map();
const MESSAGE_ID_TTL_MS = 5 * 60 * 1000; // 5 minutos
/** Remove messageIds expirados do cache. */
function cleanExpiredMessageIds() {
    const now = Date.now();
    for (const [id, ts] of processedMessageIds.entries()) {
        if (now - ts > MESSAGE_ID_TTL_MS)
            processedMessageIds.delete(id);
    }
}
class WebhookController {
    /**
     * GET /webhook — Validação do webhook (handshake com a Meta).
     */
    static validate(req, res) {
        console.log('👀 Alguém bateu na porta do Webhook!', req.query);
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        // Verifica se o token enviado pela Meta é igual ao que temos no .env
        if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
            console.log('✅ Webhook Validado com Sucesso!');
            return res.status(200).send(challenge); // Devolve para a Meta
        }
        else {
            console.error('❌ Falha na validação: Token incorreto.');
            return res.sendStatus(403); // Proibido
        }
    }
    /**
     * POST /webhook — Recepção de mensagens do WhatsApp (Card 6).
     * Responde 200 OK imediatamente e processa a mensagem de forma assíncrona.
     */
    static async receive(req, res) {
        const isMock = process.env.USE_MOCK_WHATSAPP === 'true';
        if (isMock) {
            console.log('🧪 [MOCK] Modo desenvolvimento — validação de assinatura ignorada.');
        }
        else {
            const signature = req.headers['x-hub-signature-256'];
            // Sem assinatura = status update da Meta (entregue, lido) — não é erro
            if (!signature) {
                console.log('📋 POST /webhook recebido sem assinatura (status update da Meta). Ignorando.');
                res.sendStatus(200);
                return;
            }
            const rawBody = req.rawBody;
            const appSecret = process.env.APP_SECRET;
            if (!appSecret) {
                console.error('❌ Falha na configuração: APP_SECRET não definido no .env');
                res.sendStatus(500);
                return;
            }
            if (rawBody) {
                // HMAC-SHA256: a Meta assina o body com o APP_SECRET — recalculamos e comparamos
                const expectedSignature = 'sha256=' + crypto_1.default.createHmac('sha256', appSecret).update(rawBody).digest('hex');
                if (signature !== expectedSignature) {
                    // Verifica se contém mensagens reais ou é apenas status update (entregue/lido)
                    const hasMessages = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.length > 0;
                    if (!hasMessages) {
                        // Status update com HMAC divergente — comum com ngrok, ignorar sem poluir o log
                        res.sendStatus(200);
                        return;
                    }
                    // Mensagem real com assinatura inválida — logar como erro
                    console.error('❌ Assinatura HMAC inválida em mensagem real! Possível requisição não autorizada.');
                    console.error(`   Recebida:  ${signature}`);
                    console.error(`   Esperada:  ${expectedSignature}`);
                    res.sendStatus(200);
                    return;
                }
                console.log('🔐 Assinatura HMAC válida — requisição autenticada pela Meta. ✅');
            }
            else {
                console.warn('⚠️ rawBody não capturado — pulando verificação de assinatura.');
            }
        }
        // Responde 200 OK imediatamente para evitar retentativas da Meta
        res.sendStatus(200);
        const messages = (0, whatsapp_parser_1.parseWhatsAppPayload)(req.body);
        if (messages.length === 0) {
            console.log('📋 Evento recebido sem mensagens (status update de entrega/leitura). OK.');
            return;
        }
        // Limpa cache expirado (leve, roda a cada requisição)
        cleanExpiredMessageIds();
        for (const messageData of messages) {
            // Deduplicação: ignora messageIds já processados (retries automáticos da Meta)
            if (processedMessageIds.has(messageData.messageId)) {
                console.log(`⏭️  Mensagem duplicada ignorada (messageId: ${messageData.messageId})`);
                continue;
            }
            processedMessageIds.set(messageData.messageId, Date.now());
            console.log(`📩 Mensagem de ${messageData.contactName} (${messageData.from}): ${messageData.text}`);
            await webhook_service_1.webhookService.processIncomingMessage(messageData);
        }
    }
}
exports.WebhookController = WebhookController;
