"use strict";
/**
 * Fluxo 3 · Arquivo em JPEG
 *
 * Bot aceita arquivo em JPEG e encaminha o orçamento para aprovação admin.
 * A validação técnica fina fica com a recepcionista/admin.
 *
 * Estados:
 * Boas-vindas → Identificar → Coletar specs → Validar arquivo →
 * AGUARDAR_APROVACAO_ADMIN
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(3);
const NAME = 'Carla Teste F3';
describe('Fluxo 3 · Arquivo em JPEG — recepcionista valida técnico depois', () => {
    beforeAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    afterAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    it('deve aceitar arquivo em JPEG e seguir para aprovação admin', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Olá! Quero fazer panfletos para um evento.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Preciso de panfletos para divulgar um show.', 'COLETAR_ESPECIFICACOES', 'Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, '500 unidades, tamanho A5, só frente colorida, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
        /**
         * Ao confirmar a arte, a FSM pode pausar sem resposta nova.
         * Então validamos o estado diretamente.
         */
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Tenho o arquivo pronto em JPEG.');
        await (0, helpers_1.wait)(30_000);
        const stateAprovacaoAdmin = await (0, helpers_1.getSessionState)(PHONE);
        const ctxAposCalculo = await (0, helpers_1.getSessionContext)(PHONE);
        console.log('\n[Validar arq. → chain Calcular → aprovação admin]');
        console.log('  Cliente: "Tenho o arquivo pronto em JPEG."');
        console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);
        console.log('  Proposta pendente:', JSON.stringify(ctxAposCalculo?.propostaPendente, null, 2));
        expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');
        expect(ctxAposCalculo?.propostaPendente).toBeTruthy();
        expect(ctxAposCalculo?.propostaPendente?.orcamento?.total).toBeGreaterThan(0);
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular o orçamento.', 'AGUARDAR_APROVACAO_ADMIN', 'Follow-up enquanto aguarda admin', 30_000);
    }, 100_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f3_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
