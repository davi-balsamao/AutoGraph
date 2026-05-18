import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

const authRoutes = Router();

const SALT_ROUNDS = 10;

/** bcrypt sempre prefixa o hash com $2a$, $2b$ ou $2y$. */
function looksLikeBcryptHash(senha: string): boolean {
  return /^\$2[aby]\$/.test(senha);
}

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

    if (!usuario || !usuario.senha) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // Comparação dupla:
    //  · senhas geradas pela seed/registro novo são bcrypt → compara via bcrypt;
    //  · senhas legadas plain-text (cadastradas antes do bcrypt) caem no fallback.
    // Mantemos os dois caminhos durante a transição para não invalidar usuários
    // que já estão no banco com senha em texto puro.
    const senhaArmazenada = usuario.senha;
    const senhaConfere = looksLikeBcryptHash(senhaArmazenada)
      ? await bcrypt.compare(senha, senhaArmazenada)
      : senhaArmazenada === senha;

    if (!senhaConfere) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

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
    });
  } catch (error) {
    console.error('❌ Erro no registro:', error);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

/**
 * GET /api/auth/users
 * Retorna todos os usuários cadastrados no sistema.
 */
authRoutes.get('/users', async (req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuario.findMany({
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
 */
authRoutes.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { nome, email, telefone, role, atendimentoHumano, enderecoCompleto, enderecoReferencia, senha } = req.body;

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

    // Quando admin altera a senha, hasheia antes de gravar. Se já vier hash
    // (improvável vindo da UI, mas defensivo), passa adiante intacto.
    const senhaParaGravar =
      senha === undefined
        ? existingUser.senha
        : looksLikeBcryptHash(senha)
          ? senha
          : await bcrypt.hash(senha, SALT_ROUNDS);

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
authRoutes.put('/users/:id/fcm', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { fcmToken } = req.body;

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

