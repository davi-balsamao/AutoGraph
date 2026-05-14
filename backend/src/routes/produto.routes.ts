import { Router } from 'express';
import { produtoController } from '../controllers/produto.controller';

const router = Router();

router.get('/', produtoController.list);
router.get('/:id', produtoController.getById);
router.post('/', produtoController.create);
router.put('/:id', produtoController.update);
router.delete('/:id', produtoController.delete);

export default router;
