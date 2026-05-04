import { Request, Response } from 'express';
import { parseWhatsAppPayload } from '../utils/whatsapp.parser';
import { webhookService } from '../services/webhook.service';

export class WebhookController {
  /**
   * GET /webhook — Validação do webhook (handshake com a Meta).
   */
  public static validate(req: Request, res: Response) {
    console.log('👀 Alguém bateu na porta do Webhook!', req.query);

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verifica se o token enviado pela Meta é igual ao que temos no .env
    if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
      console.log('✅ Webhook Validado com Sucesso!');
      return res.status(200).send(challenge); // Devolve para a Meta
    } else {
      console.error('❌ Falha na validação: Token incorreto.');
      return res.sendStatus(403); // Proibido
    }
  }

  /**
   * POST /webhook — Recepção de mensagens do WhatsApp (Card 6).
   * Responde 200 OK imediatamente e processa a mensagem de forma assíncrona.
   */
  public static async receive(req: Request, res: Response) {
    // Responde 200 OK imediatamente para evitar retentativas da Meta
    res.sendStatus(200);

    const messages = parseWhatsAppPayload(req.body);

    if (messages.length === 0) {
      return; // Pode ser um status update ou evento não-mensagem
    }

    for (const messageData of messages) {
      console.log(`📩 Mensagem de ${messageData.contactName} (${messageData.from}): ${messageData.text}`);
      await webhookService.processIncomingMessage(messageData);
    }
  }
}