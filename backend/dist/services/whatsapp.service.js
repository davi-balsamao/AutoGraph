"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappService = exports.WhatsAppService = void 0;
const axios_1 = __importDefault(require("axios"));
class WhatsAppService {
    /**
     * Envia uma mensagem via WhatsApp Cloud API.
     * @param to Número de destino (ex: 5512997118413)
     * @param message Conteúdo da mensagem
     */
    async sendMessage(to, message) {
        const isMock = process.env.USE_MOCK_WHATSAPP === 'true';
        if (isMock) {
            console.log(`[MOCK WPP] Mensagem enviada para ${to}: ${message}`);
            return;
        }
        try {
            const token = process.env.WA_ACCESS_TOKEN;
            const phoneId = process.env.WA_PHONE_NUMBER_ID;
            if (!token || !phoneId) {
                throw new Error('As variáveis WA_ACCESS_TOKEN e WA_PHONE_NUMBER_ID não foram encontradas no ambiente.');
            }
            await axios_1.default.post(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: message },
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log(`✅ [WPP REAL] Mensagem entregue para a Meta: ${to}`);
        }
        catch (error) {
            console.error('❌ Erro ao enviar mensagem para a Meta:', error.response?.data || error.message);
            throw error;
        }
    }
}
exports.WhatsAppService = WhatsAppService;
exports.whatsappService = new WhatsAppService();
