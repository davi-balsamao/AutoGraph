/**
 * Script one-shot: converte senhas legadas em texto puro para hash bcrypt.
 *
 * Necessário antes da remoção do fallback plain-text do login — usuários
 * cadastrados antes do bcrypt ficariam sem acesso.
 *
 * Uso: npx ts-node-dev src/scripts/hash-plaintext-passwords.ts
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

const SALT_ROUNDS = 10;

/** bcrypt sempre prefixa o hash com $2a$, $2b$ ou $2y$. */
function looksLikeBcryptHash(senha: string): boolean {
  return /^\$2[aby]\$/.test(senha);
}

async function main() {
  const usuarios = await prisma.usuario.findMany({
    where: { senha: { not: null } },
    select: { id: true, nome: true, senha: true },
  });

  let converted = 0;

  for (const usuario of usuarios) {
    if (!usuario.senha || looksLikeBcryptHash(usuario.senha)) continue;

    const hash = await bcrypt.hash(usuario.senha, SALT_ROUNDS);
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senha: hash },
    });
    converted++;
    console.log(`🔐 Senha convertida para bcrypt: ${usuario.nome} (${usuario.id})`);
  }

  console.log(
    converted === 0
      ? `✅ Nenhuma senha em texto puro encontrada (${usuarios.length} usuários verificados).`
      : `✅ ${converted} senha(s) convertida(s) de ${usuarios.length} usuários verificados.`
  );
}

main()
  .catch((e) => {
    console.error('❌ Erro ao converter senhas:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
