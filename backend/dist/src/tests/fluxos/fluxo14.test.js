"use strict";
/**
 * Fluxo 14 · Ambiguidade no produto solicitado
 *
 * Cliente começa com "cartão", depois esclarece que é cartão de visita.
 * Como as specs já ficam suficientes, o fluxo segue para VALIDAR_ARQUIVO
 * e depois para aprovação admin.
 *
 * Estados:
 * Boas-vindas → Identificar clarificado → Coletar specs →
 * Validar arq. → AGUARDAR_APROVACAO_ADMIN
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(14);
const NAME = 'Natalia Teste F14';
describe('Fluxo 14 · Ambiguidade no produto solicitado', () => {
    beforeAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    afterAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    it('deve pedir clareza sobre o produto e seguir para aprovação admin', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi, preciso de cartão.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas + ambiguidade');
        await (0, helpers_1.turno)(PHONE, NAME, 'Cartão de visita para a minha empresa.', 'COLETAR_ESPECIFICACOES', 'Identificar clarificado');
        await (0, helpers_1.turno)(PHONE, NAME, '500 unidades, formato 9x5cm, só frente colorida e verso em branco, papel couchê 300g.', 'VALIDAR_ARQUIVO', 'Coletar specs básicas');
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Tenho o arquivo em PDF com sangria de 3mm.');
        await (0, helpers_1.wait)(30_000);
        const stateAprovacaoAdmin = await (0, helpers_1.getSessionState)(PHONE);
        console.log('\n[Validar arq. → aprovação admin]');
        console.log('  Cliente: "Tenho o arquivo em PDF com sangria de 3mm."');
        console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);
        expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular o orçamento.', 'AGUARDAR_APROVACAO_ADMIN', 'Follow-up enquanto aguarda admin', 30_000);
    }, 140_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f14_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
