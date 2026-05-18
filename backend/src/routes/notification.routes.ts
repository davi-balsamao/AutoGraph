import { Router, Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { prisma } from '../config/prisma';

const notificationRoutes = Router();

/**
 * POST /api/notifications/send
 * Body: {
 *   clienteId?: string | 'all';
 *   title: string;
 *   body: string;
 *   data?: Record<string, string>;
 * }
 *
 * Permite que gerentes enviem notificações push personalizadas para um ou todos os clientes.
 */
notificationRoutes.post('/send', async (req: Request, res: Response) => {
  try {
    const { clienteId, title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Título e corpo da notificação são obrigatórios.' });
    }

    // 1. Enviar para todos os clientes
    if (!clienteId || clienteId === 'all') {
      const clientes = await prisma.usuario.findMany({
        where: { role: 'CLIENTE' },
        select: { id: true }
      });

      const ids = clientes.map(c => c.id);
      if (ids.length === 0) {
        return res.json({ message: 'Nenhum cliente cadastrado no sistema.', sentCount: 0 });
      }

      const sentCount = await notificationService.sendToUsers(ids, title, body, data);
      return res.json({ message: `Notificação enviada em lote para os clientes.`, sentCount });
    }

    // 2. Enviar para um cliente específico
    const success = await notificationService.sendToUser(clienteId, title, body, data);
    
    if (success) {
      return res.json({ message: 'Notificação enviada com sucesso para o cliente.', success: true });
    } else {
      return res.status(400).json({ error: 'Falha ao enviar notificação. O cliente pode não ter um fcmToken cadastrado.' });
    }
  } catch (error) {
    console.error('❌ Erro na rota de notificação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao enviar notificação.' });
  }
});

export default notificationRoutes;
