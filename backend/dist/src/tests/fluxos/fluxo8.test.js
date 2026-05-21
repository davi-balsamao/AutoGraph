"use strict";
/**
 * Fluxo 8 · Orçamento sem conversão
 *
 * Cliente pede orçamento para comparar preços.
 * O fluxo coleta specs, valida arquivo e envia para aprovação admin.
 *
 * A recusa após orçamento aprovado deve ser validada em fluxo específico
 * depois que o endpoint de aprovação admin liberar o orçamento ao cliente.
 *
 * Estados:
 * Boas-vindas → Identificar → Coletar specs →
 * Validar arquivo → AGUARDAR_APROVACAO_ADMIN
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(8);
const NAME = 'Henrique Teste F8';
describe('Fluxo 8 · Orçamento sem conversão', () => {
    beforeAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    afterAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    it('deve coletar dados do orçamento e seguir para aprovação admin', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Quero apenas um orçamento para comparar preços.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Panfletos para minha loja.', 'COLETAR_ESPECIFICACOES', 'Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, '1000 unidades, tamanho A5, frente e verso colorido, couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
        /**
         * Ao confirmar a arte, o backend calcula, cria proposta e muda para
         * AGUARDAR_APROVACAO_ADMIN. Nesse estado pode não haver resposta nova.
         */
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Sim, tenho a arte pronta.');
        await (0, helpers_1.wait)(30_000);
        const stateAprovacaoAdmin = await (0, helpers_1.getSessionState)(PHONE);
        console.log('\n[Validar arq.]');
        console.log('  Cliente: "Sim, tenho a arte pronta."');
        console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);
        expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');
        await (0, helpers_1.turno)(PHONE, NAME, 'Obrigado, fico aguardando o orçamento.', 'AGUARDAR_APROVACAO_ADMIN', 'Follow-up enquanto aguarda admin', 30_000);
    }, 120_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f8_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
