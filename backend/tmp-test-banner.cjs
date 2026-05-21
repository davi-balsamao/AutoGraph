require('ts-node/register');

const { PricingReadAdapter } = require('./src/adapters/pricing.adapter');

async function main() {
  const r = await PricingReadAdapter.calcular({
    produtoNome: 'Banner em Lona',
    quantidade: 2,
    specs: {
      tamanho: '100x200cm',
      acabamento: 'ilhós e cordão',
      material: 'lona vinílica',
    },
  });

  console.log('Resultado banner:', r);
}

main().catch(console.error);