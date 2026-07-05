import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import {
  signToken,
  requireAuth,
  requireGerente,
  AuthenticatedRequest,
} from '../middleware/auth.middleware';

const authRoutes = Router();

const SALT_ROUNDS = 10;

/** Campos de usuário seguros para devolver ao frontend (nunca inclui senha). */
const usuarioPublicSelect = {
  id: true,
  nome: true,
  email: true,
  telefone: true,
  role: true,
  atendimentoHumano: true,
  fcmToken: true,
  enderecoCompleto: true,
  enderecoReferencia: true,
  criadoEm: true,
  atualizadoEm: true,
} as const;

/**
 * POST /api/auth/login
 * Body: { email: string, senha: string }
 * Returns: { user: { id, nome, email, telefone, role }, token }
 *
 * Valida credenciais e emite o JWT usado nas rotas protegidas e no Socket.io.
 */
authRoutes.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !usuario.senha) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const senhaConfere = await bcrypt.compare(senha, usuario.senha);

    if (!senhaConfere) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = signToken(usuario);

    return res.json({
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone,
        role: usuario.role,
        enderecoCompleto: usuario.enderecoCompleto,
        enderecoReferencia: usuario.enderecoReferencia,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

/**
 * POST /api/auth/register
 * Body: { nome: string, email: string, senha: string, telefone?: string, enderecoCompleto?: string, enderecoReferencia?: string }
 */
authRoutes.post('/register', async (req: Request, res: Response) => {
  try {
    const { nome, email, senha, telefone, enderecoCompleto, enderecoReferencia } = req.body;

    if (!nome || !email || !senha || !telefone) {
      return res.status(400).json({ error: 'Nome, e-mail, senha e telefone são obrigatórios.' });
    }

    const existingEmail = await prisma.usuario.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    const existingPhone = await prisma.usuario.findUnique({ where: { telefone } });
    if (existingPhone) {
      return res.status(400).json({ error: 'Telefone já cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    const newUser = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        telefone,
        role: 'CLIENTE',
        enderecoCompleto: enderecoCompleto || null,
        enderecoReferencia: enderecoReferencia || null,
      },
    });

    const token = signToken(newUser);

    return res.status(201).json({
      user: {
        id: newUser.id,
        nome: newUser.nome,
        email: newUser.email,
        telefone: newUser.telefone,
        role: newUser.role,
        enderecoCompleto: newUser.enderecoCompleto,
        enderecoReferencia: newUser.enderecoReferencia,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Erro no registro:', error);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

/**
 * GET /api/auth/users
 * Retorna todos os usuários cadastrados no sistema. Restrito ao gerente.
 */
authRoutes.get('/users', requireAuth, requireGerente, async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: usuarioPublicSelect,
      orderBy: { nome: 'asc' },
    });
    return res.json(usuarios);
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

/**
 * PUT /api/auth/users/:id
 * Body: { nome, email, telefone, role, atendimentoHumano, enderecoCompleto, enderecoReferencia, senha }
 * Atualiza os dados de um usuário pelo ID.
 * Gerente edita qualquer usuário; cliente só edita o próprio cadastro e
 * não pode alterar role/atendimentoHumano.
 */
authRoutes.put('/users/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { nome, email, telefone, role, atendimentoHumano, enderecoCompleto, enderecoReferencia, senha } = req.body;

    const isGerente = req.user!.role === 'GERENTE';

    if (!isGerente && req.user!.id !== id) {
      return res.status(403).json({ error: 'Você só pode editar o seu próprio cadastro.' });
    }

    if (!isGerente && (role !== undefined || atendimentoHumano !== undefined)) {
      return res.status(403).json({ error: 'Apenas o gerente pode alterar perfil de acesso.' });
    }

    const existingUser = await prisma.usuario.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (email && email !== existingUser.email) {
      const emailDup = await prisma.usuario.findUnique({ where: { email } });
      if (emailDup) {
        return res.status(400).json({ error: 'E-mail já cadastrado.' });
      }
    }

    if (telefone && telefone !== existingUser.telefone) {
      const phoneDup = await prisma.usuario.findUnique({ where: { telefone } });
      if (phoneDup) {
        return res.status(400).json({ error: 'Telefone já cadastrado.' });
      }
    }

    // Senha nova sempre chega em texto puro da UI e é hasheada aqui.
    const senhaParaGravar =
      senha === undefined ? existingUser.senha : await bcrypt.hash(senha, SALT_ROUNDS);

    const updatedUser = await prisma.usuario.update({
      where: { id },
      data: {
        nome: nome !== undefined ? nome : existingUser.nome,
        email: email !== undefined ? email : existingUser.email,
        telefone: telefone !== undefined ? telefone : existingUser.telefone,
        role: role !== undefined ? role : existingUser.role,
        atendimentoHumano: atendimentoHumano !== undefined ? atendimentoHumano : existingUser.atendimentoHumano,
        enderecoCompleto: enderecoCompleto !== undefined ? enderecoCompleto : existingUser.enderecoCompleto,
        enderecoReferencia: enderecoReferencia !== undefined ? enderecoReferencia : existingUser.enderecoReferencia,
        senha: senhaParaGravar,
      },
    });

    return res.json({
      user: {
        id: updatedUser.id,
        nome: updatedUser.nome,
        email: updatedUser.email,
        telefone: updatedUser.telefone,
        role: updatedUser.role,
        atendimentoHumano: updatedUser.atendimentoHumano,
        enderecoCompleto: updatedUser.enderecoCompleto,
        enderecoReferencia: updatedUser.enderecoReferencia,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

/**
 * PUT /api/auth/users/:id/fcm
 * Body: { fcmToken: string }
 *
 * Registra/atualiza o Token do Firebase Cloud Messaging (FCM) de um usuário.
 */
authRoutes.put('/users/:id/fcm', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { fcmToken } = req.body;

    if (req.user!.role !== 'GERENTE' && req.user!.id !== id) {
      return res.status(403).json({ error: 'Você só pode registrar o seu próprio token FCM.' });
    }

    if (fcmToken === undefined) {
      return res.status(400).json({ error: 'Token FCM é obrigatório.' });
    }

    const existingUser = await prisma.usuario.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const updatedUser = await prisma.usuario.update({
      where: { id },
      data: { fcmToken: fcmToken || null },
    });

    console.log(`📱 Token FCM atualizado com sucesso para o usuário ${updatedUser.nome} (${updatedUser.id})`);

    return res.json({
      message: 'Token FCM atualizado com sucesso.',
      user: {
        id: updatedUser.id,
        nome: updatedUser.nome,
        role: updatedUser.role,
        fcmToken: updatedUser.fcmToken,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar token FCM do usuário:', error);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

export default authRoutes;
