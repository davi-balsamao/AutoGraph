import { prisma } from '../config/prisma';

async function main() {
  console.log('Semeando produtos...');

  const produtos = [
    {
      nome: 'Panfleto A5',
      descricao: 'Papel Couché 115g · Formato A5 · 4x4 cores',
      precoBase: 0.12
    },
    {
      nome: 'Panfleto A6',
      descricao: 'Papel Couché 115g · Formato A6 · 4x4 cores',
      precoBase: 0.06
    },
    {
      nome: 'Banner Lona 440g',
      descricao: 'Lona 440g · Acabamento em bastão e cordão',
      precoBase: 49.00
    },
    {
      nome: 'Banner Oxford',
      descricao: 'Tecido Oxford sublimado · Acabamento premium',
      precoBase: 79.00
    },
    {
      nome: 'Bloco 50fls 1 via',
      descricao: 'Bloco de anotações · 50 folhas · 1 via',
      precoBase: 12.00
    },
    {
      nome: 'Apostila Espiral',
      descricao: 'Espiral, wire-o ou costurada',
      precoBase: 18.00
    }
  ];

  await prisma.produto.deleteMany();

  for (const p of produtos) {
    await prisma.produto.create({
      data: p
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
