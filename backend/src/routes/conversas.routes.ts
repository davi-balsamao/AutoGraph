import { Router } from 'express';
import { conversasController } from '../controllers/conversas.controller';

const conversasRoutes = Router();

conversasRoutes.get('/:userId/status', conversasController.status);
conversasRoutes.get('/:userId/mensagens', conversasController.mensagens);
conversasRoutes.post('/:userId/assumir', conversasController.assumir);
conversasRoutes.post('/:userId/devolver-ia', conversasController.devolverIa);

export default conversasRoutes;
