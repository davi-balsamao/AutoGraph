"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load .env first
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const llm_entity_extractor_service_1 = require("../services/llm-entity-extractor.service");
async function testExtractor() {
    console.log('ENV LLM_MODEL:', process.env.LLM_MODEL);
    console.log('ENV GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? 'Present' : 'Missing');
    const history = `
Cliente: Oi! Quero fazer flyers para uma promoção.
Assistente: Bom dia, A AutoGraph agradece o seu contato! Como posso te ajudar?
Cliente: Flyers para uma promoção de verão da minha loja.
Assistente: Qual quantidade deseja?
Cliente: 500 unidades, tamanho A5, frente colorida, papel couchê 115g.
  `.trim();
    console.log('Sending history to LlmEntityExtractor...');
    const start = Date.now();
    try {
        const result = await llm_entity_extractor_service_1.llmEntityExtractor.extract({
            historicoCompleto: history,
            produtoAtual: 'Panfletos',
            requisitosCatalogo: [
                'Qual a quantidade desejada?',
                'Qual o tamanho (A4, A5, A6)?',
                'Qual a cor (só frente, frente e verso)?',
                'Qual o tipo de papel (couchê 115g, couchê 150g, couchê 250g)?'
            ],
            catalogoProdutos: ['Panfletos', 'Cartão de Visita', 'Blocos', 'Banner ou Lona', 'Apostila'],
        });
        console.log(`\nResponse received in ${Date.now() - start}ms:`);
        console.log(JSON.stringify(result, null, 2));
    }
    catch (err) {
        console.error('❌ Error during extraction:', err);
    }
}
testExtractor();
