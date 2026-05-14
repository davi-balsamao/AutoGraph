import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const produtos = await prisma.produto.findMany();
    console.log('Sucesso! Produtos:', produtos);
  } catch (error) {
    console.error('Erro Prisma:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
