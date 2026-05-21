require("ts-node/register");

const { calcularOrcamentoHandler } = require("./src/fsm/handlers/calcular-orcamento.handler");

async function main() {
  const sessao = {
    id: "sessao-teste",
    clienteId: "cliente-teste",
    estadoAtual: "CALCULAR_ORCAMENTO",
    contexto: {
      produto: "Cartão de Visita",
      specs: {
        "Qual quantidade deseja?": "1000",
        "A impressão será só frente ou frente e verso?": "frente e verso",
        "Terá arte pronta em PDF?": "sim"
      }
    }
  };

  const result = await calcularOrcamentoHandler.handle("", sessao, {});

  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
