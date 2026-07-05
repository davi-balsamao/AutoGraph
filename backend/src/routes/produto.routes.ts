import { Router } from 'express';
import { produtoController } from '../controllers/produto.controller';
import { requireAuth, requireGerente } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, produtoController.list);
router.get('/regras', requireAuth, produtoController.getRegras);
router.get('/:id', requireAuth, produtoController.getById);
router.post('/', requireAuth, requireGerente, produtoController.create);
router.put('/:id', requireAuth, requireGerente, produtoController.update);
router.delete('/:id', requireAuth, requireGerente, produtoController.delete);

export default router;
