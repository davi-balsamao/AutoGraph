import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

// Rota GET para validação do webhook (handshake Meta) — Card 5
router.get('/webhook', WebhookController.validate);

// Rota POST para recepção de mensagens — Card 6
router.post('/webhook', WebhookController.receive);

export default router;