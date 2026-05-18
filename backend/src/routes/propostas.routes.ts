import { Router } from 'express';
import { propostasController } from '../controllers/propostas.controller';

const propostasRoutes = Router();

propostasRoutes.get('/', propostasController.list);
propostasRoutes.patch('/:sessaoId', propostasController.update);
propostasRoutes.post('/:sessaoId/aprovar', propostasController.approve);
propostasRoutes.post('/:sessaoId/rejeitar', propostasController.reject);

export default propostasRoutes;
