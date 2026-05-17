"use strict";
/**
 * ConversationService — Card 17: Gerenciamento de Contexto de Conversa
 *
 * Serviço que recupera o histórico de mensagens do banco e formata
 * para injeção no prompt do LLM, permitindo diálogos multi-turno.
 *
 * Cada cliente tem seu próprio histórico isolado (por usuarioId).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationService = exports.ConversationService = void 0;
const mensagem_repository_1 = require("../repositories/mensagem.repository");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mensagemRepo = new mensagem_repository_1.MensagemRepository();
/** Limite padrão de mensagens no histórico. */
const DEFAULT_HISTORY_LIMIT = 20;
class ConversationService {
    historyLimit;
    constructor() {
        this.historyLimit = parseInt(process.env.CONVERSATION_HISTORY_LIMIT || '', 10) || DEFAULT_HISTORY_LIMIT;
        console.log(`📝 [ConversationService] Limite de histórico: ${this.historyLimit} mensagens`);
    }
    /**
     * Recupera o histórico de conversa formatado para o LLM.
     *
     * @param usuarioId ID do cliente no banco
     * @returns Histórico formatado como string para injeção no prompt
     */
    async getFormattedHistory(usuarioId) {
        const mensagens = await mensagemRepo.findByUsuarioId(usuarioId, this.historyLimit);
        if (mensagens.length === 0) {
            return '';
        }
        // As mensagens vêm em ordem DESC (mais recente primeiro), inverter para ordem cronológica
        const cronologico = mensagens.reverse();
        const linhas = cronologico.map((msg) => {
            const role = msg.origem === 'CLIENTE' ? 'Cliente' : 'Assistente';
            const payload = msg.payload;
            // Extrair o texto da mensagem do payload
            let text = '';
            if (typeof payload === 'object' && payload !== null) {
                text = payload.text?.body || payload.text || JSON.stringify(payload);
            }
            else {
                text = String(payload);
            }
            return `${role}: ${text}`;
        });
        return linhas.join('\n');
    }
}
exports.ConversationService = ConversationService;
exports.conversationService = new ConversationService();
