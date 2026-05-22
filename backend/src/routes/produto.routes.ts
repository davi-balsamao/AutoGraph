import { Router } from 'express';
import { produtoController } from '../controllers/produto.controller';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

router.get('/', produtoController.list);
router.get('/regras', produtoController.getRegras);
router.get('/:id', produtoController.getById);
router.post('/', uploadMiddleware.single('imagem'), produtoController.create);
router.put('/:id', uploadMiddleware.single('imagem'), produtoController.update);
router.delete('/:id', produtoController.delete);

export default router;
