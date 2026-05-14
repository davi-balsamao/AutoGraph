import { prisma } from './src/config/prisma';

async function main() {
  try {
    console.log('Tentando buscar produtos...');
    const produtos = await prisma.produto.findMany();
    console.log('Sucesso! Produtos:', produtos);
  } catch (error: any) {
    console.error('Erro detalhado:', error);
    if (error.code) console.error('Código do erro:', error.code);
    if (error.meta) console.error('Meta do erro:', error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

main();
