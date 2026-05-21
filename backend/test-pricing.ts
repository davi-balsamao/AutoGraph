// backend/test-pricing.ts
import { PricingReadAdapter } from './src/adapters/pricing.adapter';

async function rodarTesteDeterminismo() {
  console.log("🧪 Iniciando teste de precificação determinística...");
  
  const pedido = {
    produtoNome: "Cartão de Visita",
    quantidade: 1000,
    specs: { acabamento: "fosco" }
  };

  try {
    const valor1 = await PricingReadAdapter.calcular(pedido);
    const valor2 = await PricingReadAdapter.calcular(pedido);

    console.log(`Preço calculado 1: R$ ${valor1.toFixed(2)}`);
    console.log(`Preço calculado 2: R$ ${valor2.toFixed(2)}`);

    if (valor1 === valor2) {
      console.log("✅ PASSEI: O cálculo é determinístico (mesma entrada = mesma saída).");
    } else {
      console.error("❌ FALHEI: O cálculo variou!");
    }
  } catch (e) {
    console.error("❌ FALHEI: Erro no cálculo (verifique se o banco de dados está rodando).", e);
  }
}

rodarTesteDeterminismo();