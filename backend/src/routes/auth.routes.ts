import { Router, Request, Response } from 'express';
import { prisma } from '../config/prisma';

const authRoutes = Router();

/**
 * POST /api/auth/login
 * Body: { email: string, senha: string }
 * Returns: { user: { id, nome, email, telefone, role } }
 *
 * Valida credenciais e retorna Custom Claims (role).
 */
authRoutes.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Em produção, usaria bcrypt.compare. Aqui compara direto para simplificar.
    if (usuario.senha !== senha) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    return res.json({
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        role: usuario.role,
      },
    });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

export default authRoutes;
