import { prisma } from '../config/prisma';

async function main() {
  console.log('Semeando produtos...');

  const produtos = [
    {
      nome: 'Cartões de Visita',
      descricao: 'Couchê 300g, 4x4 cores, Verniz Total Frente.',
      precoBase: 85.00
    },
    {
      nome: 'Panfletos 10x14cm',
      descricao: 'Couchê 90g, 4x0 cores, 1000 unidades.',
      precoBase: 120.00
    },
    {
      nome: 'Banner Lona',
      descricao: 'Lona 440g, com acabamento em madeira e corda.',
      precoBase: 45.00
    },
    {
      nome: 'Apostila Espiral',
      descricao: 'Impressão laser PB, capa colorida, encadernação espiral.',
      precoBase: 0.15
    }
  ];

  for (const p of produtos) {
    await prisma.produto.upsert({
      where: { nome: p.nome },
      update: {},
      create: p
    });
  }

  console.log('✅ Produtos semeados com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
