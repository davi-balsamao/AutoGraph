/**
 * ConversationService — Card 17: Gerenciamento de Contexto de Conversa
 *
 * Serviço que recupera o histórico de mensagens do banco e formata
 * para injeção no prompt do LLM, permitindo diálogos multi-turno.
 *
 * Cada cliente tem seu próprio histórico isolado (por usuarioId).
 */

import { MensagemRepository } from '../repositories/mensagem.repository';
import dotenv from 'dotenv';

dotenv.config();

const mensagemRepo = new MensagemRepository();

/** Limite padrão de mensagens no histórico. */
const DEFAULT_HISTORY_LIMIT = 20;

export class ConversationService {
  private historyLimit: number;

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
  async getFormattedHistory(usuarioId: string): Promise<string> {
    const mensagens = await mensagemRepo.findByUsuarioId(usuarioId, this.historyLimit);

    if (mensagens.length === 0) {
      return '';
    }

    // As mensagens vêm em ordem DESC (mais recente primeiro), inverter para ordem cronológica
    const cronologico = mensagens.reverse();

    const linhas = cronologico.map((msg) => {
      const role = msg.origem === 'CLIENTE' ? 'Cliente' : 'Assistente';
      const payload = msg.payload as any;

      // Extrair o texto da mensagem do payload
      let text = '';
      if (typeof payload === 'object' && payload !== null) {
        text = payload.text?.body || payload.text || JSON.stringify(payload);
      } else {
        text = String(payload);
      }

      return `${role}: ${text}`;
    });

    return linhas.join('\n');
  }
}

export const conversationService = new ConversationService();
