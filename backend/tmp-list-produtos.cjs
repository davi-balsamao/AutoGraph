require("ts-node/register");

const { prisma } = require("./src/config/prisma");

async function main() {
  const produtos = await prisma.produto.findMany();
  console.table(produtos.map((x) => ({
    nome: x.nome,
    precoBase: x.precoBase,
  })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
