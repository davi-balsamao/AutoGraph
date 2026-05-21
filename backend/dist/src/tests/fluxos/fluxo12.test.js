"use strict";
/**
 * Fluxo 12 · Condição financeira influencia decisão
 *
 * Cliente precisa saber sobre parcelamento antes de decidir.
 * Com base nisso, avança com o pedido até aprovação admin.
 *
 * Estados:
 * Boas-vindas → Identificar/Esclarecer pag. → Coletar specs →
 * Validar arq. → AGUARDAR_APROVACAO_ADMIN
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(12);
const NAME = 'Luana Teste F12';
describe('Fluxo 12 · Dúvida sobre pagamento antes de decidir', () => {
    beforeAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    afterAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    it('deve informar formas de pagamento e seguir para aprovação admin', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Tenho uma dúvida sobre pagamento antes de fazer o pedido.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Quero panfletos, mas primeiro preciso saber se posso parcelar.', 'ESCLARECER_DUVIDA', 'Identificar + Esclarecer pag.', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Vocês aceitam parcelamento no cartão? Em quantas vezes?', 'ESCLARECER_DUVIDA', 'Esclarecer pagamento', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Ótimo, então posso parcelar. Quero fazer panfletos.', 'COLETAR_ESPECIFICACOES', 'Coletar specs');
        await (0, helpers_1.turno)(PHONE, NAME, '1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Specs completas');
        /**
         * Ao confirmar a arte, o backend calcula, cria a proposta e muda para
         * AGUARDAR_APROVACAO_ADMIN. Nesse estado pode não haver resposta nova.
         */
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Sim, tenho o arquivo de arte em PDF.');
        await (0, helpers_1.wait)(30_000);
        const stateAprovacaoAdmin = await (0, helpers_1.getSessionState)(PHONE);
        console.log('\n[Validar arq.]');
        console.log('  Cliente: "Sim, tenho o arquivo de arte em PDF."');
        console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);
        expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular o orçamento.', 'AGUARDAR_APROVACAO_ADMIN', 'Follow-up enquanto aguarda admin', 30_000);
    }, 500_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f12_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
