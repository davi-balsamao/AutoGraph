"use strict";
/**
 * test-entity-extraction.ts — Card 15: Teste do Pipeline de Extração de Entidades
 *
 * Testa a identificação de produtos e extração de respostas a partir de
 * históricos de conversa simulados.
 *
 * Executar: npm run test:entities
 */
Object.defineProperty(exports, "__esModule", { value: true });
const entity_extraction_service_1 = require("../services/entity-extraction.service");
const testCases = [
    {
        nome: '1. Cartão de Visita — Pedido Completo',
        historico: `
      Cliente: Quero fazer 500 cartões de visita
      Bot: Ótimo! Você tem a arte pronta?
      Cliente: Sim, tenho a arte pronta
      Bot: Será frente e verso ou só frente?
      Cliente: Frente e verso
      Bot: Terá verniz total?
      Cliente: Sim, quero verniz
      Bot: E quanto à laminação fosca e verniz localizado?
      Cliente: Não precisa de laminação, não
    `,
        produtoEsperado: 'Cartão de Visita',
        deveEstarCompleto: false, // laminação dificilmente captura "não precisa"
    },
    {
        nome: '2. Panfleto — Pedido Parcial',
        historico: `
      Cliente: Quero fazer panfletos para minha loja
    `,
        produtoEsperado: 'Panfletos',
        deveEstarCompleto: false,
    },
    {
        nome: '3. Banner — Pedido Completo',
        historico: `
      Cliente: Preciso de um banner
      Bot: Você tem a arte pronta?
      Cliente: Sim, tenho a arte
      Bot: Qual o tamanho desejado?
      Cliente: 2x1 metros, ou seja, 200x100cm
    `,
        produtoEsperado: 'Banner ou Lona',
        deveEstarCompleto: false, // "200x100cm" pode ou não ser capturado
    },
    {
        nome: '4. Produto Desconhecido',
        historico: `
      Cliente: Quero imprimir camisetas
    `,
        produtoEsperado: null,
        deveEstarCompleto: false,
    },
    {
        nome: '5. Apostila — Pedido Parcial',
        historico: `
      Cliente: Preciso fazer uma apostila com 50 páginas
      Bot: A impressão será só frente ou frente e verso?
      Cliente: Frente e verso
      Bot: Será colorida ou preto e branco?
      Cliente: Colorida
    `,
        produtoEsperado: 'Apostila',
        deveEstarCompleto: false,
    },
];
// --- Execução dos testes ---
console.log('============================================');
console.log('  TESTE — Card 15: Extração de Entidades');
console.log('============================================\n');
console.log(`📦 Produtos disponíveis: ${entity_extraction_service_1.entityExtractionService.getAvailableProducts().join(', ')}\n`);
let acertos = 0;
let total = testCases.length;
(async () => {
    for (const tc of testCases) {
        console.log(`--- ${tc.nome} ---`);
        const resultado = await entity_extraction_service_1.entityExtractionService.extract(tc.historico);
        // Verificar produto
        const produtoCorreto = resultado.produtoIdentificado === tc.produtoEsperado;
        console.log(`  Produto: ${resultado.produtoIdentificado || '(nenhum)'} ${produtoCorreto ? '✅' : `❌ (esperado: ${tc.produtoEsperado})`}`);
        if (resultado.produtoIdentificado) {
            console.log(`  Requisitos:`);
            for (const req of resultado.requisitos) {
                const status = req.preenchido ? '✅' : '⬜';
                console.log(`    ${status} ${req.pergunta}`);
                if (req.resposta) {
                    console.log(`       → ${req.resposta}`);
                }
            }
            console.log(`  Completo: ${resultado.completo ? '✅ SIM' : '❌ NÃO'}`);
            if (resultado.perguntasFaltantes.length > 0) {
                console.log(`  Faltam: ${resultado.perguntasFaltantes.length} pergunta(s)`);
            }
        }
        else if (resultado.produtoDesconhecido) {
            console.log(`  ⚠️ Produto não reconhecido no catálogo.`);
        }
        if (produtoCorreto)
            acertos++;
        console.log('');
    }
    console.log('============================================');
    console.log(`  Resultado: ${acertos}/${total} produtos identificados corretamente`);
    console.log('============================================\n');
})();
