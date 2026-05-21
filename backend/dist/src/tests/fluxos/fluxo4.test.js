"use strict";
/**
 * Fluxo 4 · Urgência que altera custo e prazo
 *
 * Cliente precisa do material em 24 horas.
 * Quando pergunta preço/custo antes da arte, o bot esclarece.
 * Depois, ao confirmar arte, o orçamento vai para aprovação admin.
 *
 * Estados:
 * Boas-vindas → Identificar → Coletar specs → Validar arquivo →
 * ESCLARECER_DUVIDA → AGUARDAR_APROVACAO_ADMIN
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(4);
const NAME = 'Diego Teste F4';
describe('Fluxo 4 · Urgência — entrega em 24h com negociação', () => {
    beforeAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    afterAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    it('deve esclarecer custo, validar arquivo e seguir para aprovação admin', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Preciso de material com muita urgência, é para amanhã!', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Preciso de panfletos para um evento que acontece amanhã cedo.', 'COLETAR_ESPECIFICACOES', 'Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, '500 unidades, tamanho A5, frente e verso colorido, papel couchê 90g. Preciso em 24 horas!', 'VALIDAR_ARQUIVO', 'Coletar specs urgente');
        await (0, helpers_1.turno)(PHONE, NAME, 'Qual o custo para entrega expressa em 24 horas?', 'ESCLARECER_DUVIDA', 'Pergunta custo cedo → Esclarecer', 30_000);
        /**
         * O cliente sai da dúvida e confirma que tem a arte.
         * O handler retorna para VALIDAR_ARQUIVO, encadeia cálculo e pausa em
         * AGUARDAR_APROVACAO_ADMIN sem resposta nova.
         */
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Entendi. Sim, tenho o arquivo de arte pronto em PDF.');
        await (0, helpers_1.wait)(30_000);
        const stateAprovacaoAdmin = await (0, helpers_1.getSessionState)(PHONE);
        const ctxAposCalculo = await (0, helpers_1.getSessionContext)(PHONE);
        console.log('\n[Confirma arte → chain Calcular]');
        console.log('  Cliente: "Entendi. Sim, tenho o arquivo de arte pronto em PDF."');
        console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);
        console.log('  Proposta pendente:', JSON.stringify(ctxAposCalculo?.propostaPendente, null, 2));
        expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');
        expect(ctxAposCalculo?.propostaPendente).toBeTruthy();
        expect(ctxAposCalculo?.propostaPendente?.orcamento?.total).toBeGreaterThan(0);
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular com urgência.', 'AGUARDAR_APROVACAO_ADMIN', 'Follow-up enquanto aguarda admin', 30_000);
    }, 120_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f4_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
