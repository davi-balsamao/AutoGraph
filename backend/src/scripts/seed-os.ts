import 'dotenv/config';
import { PrismaClient, StatusOS } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient();

async function main() {
  const cliente = await prisma.usuario.findFirst({ where: { role: 'CLIENTE' } });
  if (!cliente) {
    console.log('Rode npm run seed primeiro.');
    return;
  }

  await prisma.ordensDeServico.create({
    data: {
      clienteId: cliente.id,
      status: StatusOS.AGUARDANDO_ORCAMENTO,
      especificacoes: { produto: 'Cartões de Visita', quantidade: 1000, papel: 'Couchê 300g' },
      mensagem_sugerida: 'Olá! Segue o orçamento dos cartões.',
    }
  });

  console.log('OS Fictícia criada com sucesso!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
