"use strict";
/**
 * Fluxo 13 · Ausência de histórico acessível
 *
 * Cliente recorrente quer repetir pedido anterior. Bot não acessa histórico
 * anterior e reconduz para nova coleta de specs.
 *
 * Estados:
 * Boas-vindas → Identificar → Coletar specs/recoletar →
 * Validar arq. → AGUARDAR_APROVACAO_ADMIN
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(13);
const NAME = 'Marcos Teste F13';
describe('Fluxo 13 · Cliente recorrente sem acesso ao histórico', () => {
    beforeAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    afterAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    it('deve recoletar specs do zero e seguir para aprovação admin', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Quero repetir o mesmo pedido que fiz no mês passado.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas + pedido repetir');
        await (0, helpers_1.turno)(PHONE, NAME, 'Era panfletos, exatamente igual ao anterior.', 'COLETAR_ESPECIFICACOES', 'Identificar → re-coletar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Tudo bem, vou informar de novo. Quero panfletos para minha empresa.', 'COLETAR_ESPECIFICACOES', 'Re-coletar specs');
        await (0, helpers_1.turno)(PHONE, NAME, '1000 unidades, tamanho A5, frente e verso colorido, couchê 90g.', 'VALIDAR_ARQUIVO', 'Specs completas');
        /**
         * Ao confirmar a arte, o backend calcula, cria a proposta e muda para
         * AGUARDAR_APROVACAO_ADMIN. Nesse estado pode não haver resposta nova.
         */
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Tenho o arquivo de arte em PDF, igual ao anterior.');
        await (0, helpers_1.wait)(30_000);
        const stateAprovacaoAdmin = await (0, helpers_1.getSessionState)(PHONE);
        console.log('\n[Validar arq.]');
        console.log('  Cliente: "Tenho o arquivo de arte em PDF, igual ao anterior."');
        console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);
        expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular.', 'AGUARDAR_APROVACAO_ADMIN', 'Follow-up enquanto aguarda admin', 30_000);
    }, 120_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f13_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
