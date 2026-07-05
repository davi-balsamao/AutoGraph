import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
  id: string;
  role: 'CLIENTE' | 'GERENTE';
  nome: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/** Payload assinado no login. `sub` carrega o id do usuário (convenção JWT). */
interface TokenPayload {
  sub: string;
  role: AuthUser['role'];
  nome: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Sem segredo não há como assinar/validar tokens — melhor falhar alto do que rodar aberto.
    throw new Error('JWT_SECRET não definido no .env');
  }
  return secret;
}

export function signToken(user: { id: string; role: string; nome: string }): string {
  const payload: TokenPayload = {
    sub: user.id,
    role: user.role as AuthUser['role'],
    nome: user.nome,
  };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
  });
}

/** Valida o JWT também fora do Express (handshake do Socket.io). */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload & TokenPayload;
    if (!decoded.sub || !decoded.role) return null;
    return { id: decoded.sub, role: decoded.role, nome: decoded.nome };
  } catch {
    return null;
  }
}

/**
 * Exige header `Authorization: Bearer <token>` válido.
 * Anexa `req.user` para os handlers seguintes.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }

  const user = verifyToken(header.slice('Bearer '.length));
  if (!user) {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }

  req.user = user;
  return next();
}

/** Exige role GERENTE. Usar sempre depois de requireAuth. */
export function requireGerente(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }
  if (req.user.role !== 'GERENTE') {
    return res.status(403).json({ error: 'Acesso restrito ao gerente.' });
  }
  return next();
}
