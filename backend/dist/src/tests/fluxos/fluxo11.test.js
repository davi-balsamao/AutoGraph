"use strict";
/**
 * Fluxo 11 · Múltiplas dúvidas antes de qualquer spec
 *
 * Cliente técnico quer entender laminação, gramaturas e sangria.
 * Passa por ESCLARECER_DUVIDA várias vezes antes de coletar specs.
 *
 * Estados:
 * Boas-vindas → Identificar → Esclarecer → Esclarecer → Esclarecer →
 * Coletar specs → Validar arq. → AGUARDAR_APROVACAO_ADMIN
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(11);
const NAME = 'Kleber Teste F11';
describe('Fluxo 11 · Múltiplas dúvidas antes das specs', () => {
    beforeAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    afterAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    it('deve responder múltiplas dúvidas técnicas e seguir para aprovação admin', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Olá! Tenho bastante dúvida antes de fazer o pedido.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Quero cartões de visita, mas preciso entender as opções primeiro.', 'COLETAR_ESPECIFICACOES', 'Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Qual é a diferença entre laminação fosca e brilhosa?', 'ESCLARECER_DUVIDA', 'Esclarecer 1 – laminação', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'E sobre gramatura do papel: qual você recomenda para cartão de visita?', 'ESCLARECER_DUVIDA', 'Esclarecer 2 – gramatura', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'O que é sangria no arquivo de arte? Como devo preparar?', 'ESCLARECER_DUVIDA', 'Esclarecer 3 – sangria', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Entendi tudo! Agora quero cartões de visita com laminação fosca.', 'COLETAR_ESPECIFICACOES', 'Coletar specs');
        await (0, helpers_1.turno)(PHONE, NAME, '500 unidades, formato 9x5cm, frente e verso colorido, couchê 300g, laminação fosca.', 'VALIDAR_ARQUIVO', 'Specs completas');
        /**
         * Ao confirmar a arte, o backend calcula, cria a proposta e muda para
         * AGUARDAR_APROVACAO_ADMIN. Nesse estado pode não haver resposta nova.
         */
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Tenho o arquivo em PDF com 3mm de sangria e resolução 300 dpi.');
        await (0, helpers_1.wait)(30_000);
        const stateAprovacaoAdmin = await (0, helpers_1.getSessionState)(PHONE);
        console.log('\n[aprovação admin]');
        console.log('  Cliente: "Tenho o arquivo em PDF com 3mm de sangria e resolução 300 dpi."');
        console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);
        expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular o orçamento.', 'AGUARDAR_APROVACAO_ADMIN', 'Follow-up enquanto aguarda admin', 30_000);
    }, 360_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f11_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
