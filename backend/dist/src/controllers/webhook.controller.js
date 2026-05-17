"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const whatsapp_parser_1 = require("../utils/whatsapp.parser");
const webhook_service_1 = require("../services/webhook.service");
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
        const signature = req.headers['x-hub-signature-256'];
        const isMock = process.env.USE_MOCK_WHATSAPP === 'true';
        // Em produção, a assinatura é obrigatória. Em mock, validamos apenas se ela for enviada.
        if (!isMock || signature) {
            if (!signature) {
                console.error('❌ Falha na validação do Webhook: Assinatura ausente.');
                return res.sendStatus(403);
            }
            const rawBody = req.rawBody;
            const appSecret = process.env.APP_SECRET;
            if (!appSecret) {
                console.error('❌ Falha na configuração: APP_SECRET não definido no .env');
                return res.sendStatus(500);
            }
            if (rawBody) {
                const expectedSignature = 'sha256=' + crypto_1.default.createHmac('sha256', appSecret).update(rawBody).digest('hex');
                if (signature !== expectedSignature) {
                    console.error('❌ Falha na validação do Webhook: Assinatura inválida.');
                    return res.sendStatus(403);
                }
            }
            else {
                console.warn('⚠️ rawBody não encontrado. Ignorando validação (apenas para ambiente de desenvolvimento/mock sem rawBody config)');
            }
        }
        // Responde 200 OK imediatamente para evitar retentativas da Meta
        res.sendStatus(200);
        const messages = (0, whatsapp_parser_1.parseWhatsAppPayload)(req.body);
        if (messages.length === 0) {
            return; // Pode ser um status update ou evento não-mensagem
        }
        for (const messageData of messages) {
            console.log(`📩 Mensagem de ${messageData.contactName} (${messageData.from}): ${messageData.text}`);
            await webhook_service_1.webhookService.processIncomingMessage(messageData);
        }
    }
}
exports.WebhookController = WebhookController;
