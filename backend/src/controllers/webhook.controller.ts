import { Request, Response } from 'express';

export class WebhookController {
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
}