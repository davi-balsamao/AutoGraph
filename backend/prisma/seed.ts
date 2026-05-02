import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  console.log('Start seeding...');

  // Upsert Cliente
  const cliente = await prisma.usuario.upsert({
    where: { email: 'cliente@exemplo.com' },
    update: {},
    create: {
      nome: 'Cliente Exemplo',
      email: 'cliente@exemplo.com',
      telefone: '5511999999999',
      senha: 'senha_segura_cliente',
      role: 'CLIENTE',
    },
  });
  console.log(`Created/Updated cliente: ${cliente.nome}`);

  // Upsert Gerente
  const gerente = await prisma.usuario.upsert({
    where: { email: 'gerente@grafica.com' },
    update: {},
    create: {
      nome: 'Gerente Gráfica',
      email: 'gerente@grafica.com',
      telefone: '5511988888888',
      senha: 'senha_segura_gerente',
      role: 'GERENTE',
    },
  });
  console.log(`Created/Updated gerente: ${gerente.nome}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
