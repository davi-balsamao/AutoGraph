"use strict";
/**
 * Testes do parser e do shape da extração LLM.
 * Não chamam o Gemini de verdade — só validamos parseLlmResponse, que é a
 * fronteira frágil (JSON malformado, código-fence, campos faltantes).
 */
Object.defineProperty(exports, "__esModule", { value: true });
const llm_entity_extractor_service_1 = require("../../services/llm-entity-extractor.service");
describe('parseLlmResponse', () => {
    it('aceita JSON puro com todos os campos', () => {
        const raw = JSON.stringify({
            produtoIdentificado: 'Panfletos',
            produtoDesconhecido: false,
            intent: 'NOVO_PEDIDO',
            specs: { 'Qual quantidade deseja?': '1000 unidades' },
            resolveuReferencia: null,
        });
        const r = (0, llm_entity_extractor_service_1.parseLlmResponse)(raw);
        expect(r.produtoIdentificado).toBe('Panfletos');
        expect(r.intent).toBe('NOVO_PEDIDO');
        expect(r.specs['Qual quantidade deseja?']).toBe('1000 unidades');
    });
    it('aceita JSON envolvido em markdown code fence', () => {
        const raw = '```json\n' + JSON.stringify({
            produtoIdentificado: 'Cartão de Visita',
            produtoDesconhecido: false,
            intent: 'APROVACAO',
            specs: {},
            resolveuReferencia: null,
        }) + '\n```';
        const r = (0, llm_entity_extractor_service_1.parseLlmResponse)(raw);
        expect(r.produtoIdentificado).toBe('Cartão de Visita');
        expect(r.intent).toBe('APROVACAO');
    });
    it('normaliza intent inválido para OUTRO', () => {
        const raw = JSON.stringify({
            produtoIdentificado: null,
            produtoDesconhecido: false,
            intent: 'XYZ_INVALIDO',
            specs: {},
            resolveuReferencia: null,
        });
        expect((0, llm_entity_extractor_service_1.parseLlmResponse)(raw).intent).toBe('OUTRO');
    });
    it('descarta resposta vazia em specs (preenchido = false)', () => {
        const raw = JSON.stringify({
            produtoIdentificado: 'Apostila',
            produtoDesconhecido: false,
            intent: 'NOVO_PEDIDO',
            specs: { 'Quantas páginas?': '', 'Cor?': null, 'Espiral?': 'sim' },
            resolveuReferencia: null,
        });
        const r = (0, llm_entity_extractor_service_1.parseLlmResponse)(raw);
        expect(r.specs['Quantas páginas?']).toBeNull();
        expect(r.specs['Cor?']).toBeNull();
        expect(r.specs['Espiral?']).toBe('sim');
    });
    it('preserva referência resolvida quando bem formada', () => {
        const raw = JSON.stringify({
            produtoIdentificado: 'Panfletos',
            produtoDesconhecido: false,
            intent: 'NOVO_PEDIDO',
            specs: {},
            resolveuReferencia: { texto: 'a primeira', referenciaEncontrada: '10x14cm' },
        });
        const r = (0, llm_entity_extractor_service_1.parseLlmResponse)(raw);
        expect(r.resolveuReferencia).toEqual({ texto: 'a primeira', referenciaEncontrada: '10x14cm' });
    });
    it('lança erro em JSON inválido', () => {
        expect(() => (0, llm_entity_extractor_service_1.parseLlmResponse)('isso nem é JSON')).toThrow(/não-JSON/);
    });
    it('lança erro quando saída é JSON mas não-objeto', () => {
        expect(() => (0, llm_entity_extractor_service_1.parseLlmResponse)('"apenas uma string"')).toThrow();
    });
});
