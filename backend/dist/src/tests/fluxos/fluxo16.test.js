"use strict";
/**
 * Fluxo 16 · Exigência de desconto além da margem
 * Após orçamento, cliente exige 40% de desconto e insiste várias vezes.
 * Agente oferece alternatives dentro da margem, não cede. Escalada para humano.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Calcular →
 * Apresentar → Aguardar aprov. → Negociar → Escalar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(16);
const NAME = 'Patricia Teste F16';
describe('Fluxo 16 · Negociação agressiva → escalada', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve negar desconto excessivo e escalar para humano', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Quero fazer banners para minha loja.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Dois banners grandes para vitrine.', 'COLETAR_ESPECIFICACOES', 'Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Banners 100x200cm, lona vinílica, acabamento com ilhós e cordão.', 'VALIDAR_ARQUIVO', 'Coletar specs');
        await (0, helpers_1.turno)(PHONE, NAME, 'Tenho arte em PDF, resolução 300 dpi.', 'AGUARDAR_APROVACAO', 'Validar arq.');
        // Pedido dentro da margem (total R$200 → margem 5%): entra em NEGOCIAR
        // e o handler tenta uma contraproposta via RAG.
        await (0, helpers_1.turno)(PHONE, NAME, 'Achei um pouco caro. Consegue um desconto de 5%?', 'NEGOCIAR', 'Negociar dentro da margem');
        // Cliente sobe a exigência para 40% (acima dos 5% permitidos):
        // pré-filtro de margem em negociar.handler.ts escala direto para humano.
        await (0, helpers_1.turno)(PHONE, NAME, 'Não posso pagar tudo isso, preciso de 40% de desconto ou não fecho.', 'ESCALAR_HUMANO', 'Insistência acima da margem');
        // Com atendimento humano ativo, IA permanece silenciada e estado fica em ESCALAR_HUMANO.
        await (0, helpers_1.turno)(PHONE, NAME, 'Então quero falar com um gerente! Isso é abuso de preço!', 'ESCALAR_HUMANO', 'Escalada', { expectNewResponse: false });
    }, 130_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f16_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
