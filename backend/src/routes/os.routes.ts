import { Router } from 'express';
import { osController } from '../controllers/os.controller';
import { uploadMiddleware } from '../middleware/upload.middleware';
import { requireAuth, requireGerente } from '../middleware/auth.middleware';

const osRoutes = Router();

// Criar nova OS com upload de arte opcional (ação do painel do gerente)
osRoutes.post('/', requireAuth, requireGerente, uploadMiddleware.single('arte'), osController.create);

// Listar OS (gerente vê todas; cliente só as próprias — filtro no controller)
osRoutes.get('/', requireAuth, osController.list);

// Histórico de mensagens de uma OS específica
osRoutes.get('/:id/mensagens', requireAuth, osController.getMensagensDaOs);

// Atualizar status de uma OS
osRoutes.patch('/:id/status', requireAuth, requireGerente, osController.updateStatus);

// Atualizar dados variados (observacoes, especificacoes)
osRoutes.patch('/:id', requireAuth, requireGerente, osController.updateData);

// Timer de produção
osRoutes.patch('/:id/timer/start', requireAuth, requireGerente, osController.startTimer);
osRoutes.patch('/:id/timer/stop', requireAuth, requireGerente, osController.stopTimer);

export default osRoutes;
