import { Router } from 'express';
import { osController } from '../controllers/os.controller';

const osRoutes = Router();

// Listar todas as OS
osRoutes.get('/', osController.list);

// Histórico de mensagens de uma OS específica
osRoutes.get('/:id/mensagens', osController.getMensagensDaOs);

// Atualizar status de uma OS
osRoutes.patch('/:id/status', osController.updateStatus);

// Timer de produção
osRoutes.patch('/:id/timer/start', osController.startTimer);
osRoutes.patch('/:id/timer/stop', osController.stopTimer);

export default osRoutes;