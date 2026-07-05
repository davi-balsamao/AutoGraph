import { Router } from 'express';
import { propostasController } from '../controllers/propostas.controller';
import { requireAuth, requireGerente } from '../middleware/auth.middleware';

const propostasRoutes = Router();

// Fluxo de revisão/aprovação de orçamentos — exclusivo do gerente.
propostasRoutes.use(requireAuth, requireGerente);

propostasRoutes.get('/', propostasController.list);
propostasRoutes.patch('/:sessaoId', propostasController.update);
propostasRoutes.post('/:sessaoId/aprovar', propostasController.approve);
propostasRoutes.post('/:sessaoId/rejeitar', propostasController.reject);

export default propostasRoutes;
