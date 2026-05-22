import { prisma } from '../config/prisma';

async function main() {
  console.log('Semeando produtos...');

  const produtos = [
    {
      nome: 'Cartões de Visita',
      descricao: 'Couchê 300g. Acabamento em laminação fosca, verniz localizado, ou total.',
      precoBase: 85.00
    },
    {
      nome: 'Panfleto',
      descricao: 'Couchê 90g ou 115g. Opções de dobra e refile.',
      precoBase: 0.12
    },
    {
      nome: 'Bloco',
      descricao: 'Autocopiativo ou Offset 75g/90g. Numerado e blocado.',
      precoBase: 12.00
    },
    {
      nome: 'Banner Lona',
      descricao: 'Impressão em lona com ilhós e bainha ou madeira e corda.',
      precoBase: 49.00
    },
    {
      nome: 'Apostila',
      descricao: 'Offset 75g ou 90g. Encadernação wire-o ou espiral.',
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
