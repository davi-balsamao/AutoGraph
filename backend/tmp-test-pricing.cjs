require("ts-node/register");

const { PricingReadAdapter } = require("./src/adapters/pricing.adapter");

async function main() {
  const testes = [
    {
      nome: "Cartão de Visita 1000 un.",
      input: {
        produtoNome: "Cartão de Visita",
        quantidade: 1000,
        specs: {
          "Qual quantidade deseja?": "1000",
          "A impressão será só frente ou frente e verso?": "frente e verso",
          "Terá verniz total?": "Sem verniz total",
          "Terá laminação fosca e verniz localizado?": "Sem laminação",
        },
      },
    },
    {
      nome: "Bloco 2 un.",
      input: {
        produtoNome: "Blocos",
        quantidade: 2,
        specs: {
          "Qual quantidade deseja?": "2",
          "Qual o tamanho do bloco?": "A4",
          "Quantas vias terá cada folha?": "2 vias",
          "O papel será autocopiativo?": "Sim",
          "Qual a cor da impressão?": "Colorido",
          "O bloco será numerado?": "Sim",
        },
      },
    },
    {
      nome: "Banner 1 un.",
      input: {
        produtoNome: "Banner em Lona",
        quantidade: 1,
        specs: {
          "Qual quantidade deseja?": "1",
          "Qual o tamanho?": "2 x 1",
        },
      },
    },
  ];

  for (const teste of testes) {
    try {
      const total = await PricingReadAdapter.calcular(teste.input);
      console.log(`? ${teste.nome}: R$ ${total.toFixed(2)}`);
    } catch (error) {
      console.error(`? ${teste.nome}:`, error.message);
    }
  }
}

main();
