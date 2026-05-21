"use strict";
/**
 * Fluxo 10 · Produto completamente fora do catálogo
 *
 * Cliente pede copos personalizados com logo.
 * A gráfica não faz esse produto, então o agente informa indisponibilidade,
 * sugere alternativas impressas e encerra com educação.
 *
 * Estados:
 * Boas-vindas → Identificar → Produto indisponível → Encerrar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(10);
const NAME = 'João Teste F10';
describe('Fluxo 10 · Produto fora do catálogo', () => {
    beforeAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    afterAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    it('deve informar produto indisponível e encerrar com educação', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Quero copos personalizados com o logo da minha empresa.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas + produto indisp.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Preciso de 100 copos com meu logo impresso.', 'PRODUTO_INDISPONIVEL', 'Identificar → Prod. indisp.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Entendido, vocês não fazem copos. Tem alguma alternativa impressa?', 'PRODUTO_INDISPONIVEL', 'Alternativa');
        await (0, helpers_1.turno)(PHONE, NAME, 'Tudo bem, por enquanto não preciso de mais nada. Obrigado!', 'ENCERRAR', 'Encerrar');
    }, 120_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f10_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
