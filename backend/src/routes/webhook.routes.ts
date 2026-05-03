import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller';

const router = Router();

// Rota GET para validação
router.get('/webhook', WebhookController.validate);

export default router;