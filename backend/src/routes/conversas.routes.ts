import { Router } from 'express';
import { conversasController } from '../controllers/conversas.controller';
import { requireAuth, requireGerente } from '../middleware/auth.middleware';

const conversasRoutes = Router();

// Takeover de conversas do WhatsApp — exclusivo do gerente.
conversasRoutes.use(requireAuth, requireGerente);

conversasRoutes.get('/:userId/status', conversasController.status);
conversasRoutes.get('/:userId/mensagens', conversasController.mensagens);
conversasRoutes.post('/:userId/assumir', conversasController.assumir);
conversasRoutes.post('/:userId/devolver-ia', conversasController.devolverIa);

export default conversasRoutes;
