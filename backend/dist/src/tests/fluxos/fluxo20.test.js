"use strict";
/**
 * Fluxo 20 · Uso fora do propósito do bot
 * "Me conta uma piada" / "Qual é a receita de bolo?" Agente reconhece
 * educadamente que não é o canal adequado e redireciona ao tema.
 *
 * Estados: (qualquer) → (redirect) → (mesmo estado)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(20);
const NAME = 'Ulisses Teste F20';
describe('Fluxo 20 · Mensagem fora do escopo do bot', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve redirecionar off-topic sem responder ao pedido fora do escopo', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Me conta uma piada boa!', 'COLETAR_ESPECIFICACOES', 'Off-topic 1 — piada');
        await (0, helpers_1.turno)(PHONE, NAME, 'Qual é a receita do bolo de chocolate perfeito?', 'COLETAR_ESPECIFICACOES', 'Off-topic 2 — receita');
        await (0, helpers_1.turno)(PHONE, NAME, 'Ok ok, então quero fazer um pedido de panfletos.', 'AGUARDAR_RETORNO', 'Retorno ao tema');
    }, 40_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f20_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
    it('deve responder a entrada incompleta', async () => {
        await (0, helpers_1.sendMsg)(PHONE, NAME, '???');
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 20_000);
});
