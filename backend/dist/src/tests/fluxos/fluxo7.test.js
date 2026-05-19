"use strict";
/**
 * Fluxo 7 · Reclamação como primeira mensagem
 * Cliente insatisfeito com pedido anterior. Bot não tem alçada para resolver
 * histórico — escalada imediata sem tentar coletar nada.
 *
 * Estados: Boas-vindas → Escalar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(7);
const NAME = 'Gabriela Teste F7';
describe('Fluxo 7 · Reclamação — escalada imediata', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve escalar imediatamente sem tentar coletar pedido novo', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'O pedido que fiz semana passada saiu completamente errado! As cores estão todas erradas e o tamanho é diferente do que pedi!', 'ESCALAR_HUMANO', 'Reclamação → Escalar');
        // Após escalar, IA fica silenciada — não há resposta nova do bot.
        await (0, helpers_1.turno)(PHONE, NAME, 'Preciso falar com um atendente agora, isso é inaceitável!', 'ESCALAR_HUMANO', 'Confirmação escalada', { expectNewResponse: false });
    }, 300_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f7_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
