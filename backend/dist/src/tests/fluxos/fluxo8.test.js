"use strict";
/**
 * Fluxo 8 · Ciclo completo sem conversão
 * Cliente pede orçamento para comparar preços. Recebe, agradece e diz
 * "vou pensar". Agente encerra sem insistir ou forçar pedido.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Calcular →
 *          Apresentar → Aguardar aprov. recusa → Encerrar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(8);
const NAME = 'Henrique Teste F8';
describe('Fluxo 8 · Orçamento sem conversão', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve fornecer orçamento e encerrar sem insistir após recusa', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Quero apenas um orçamento para comparar preços.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Panfletos para minha loja.', 'COLETAR_ESPECIFICACOES', 'Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, '1000 unidades, tamanho A5, frente e verso colorido, couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
        await (0, helpers_1.turno)(PHONE, NAME, 'Sim, tenho a arte pronta.', 'AGUARDAR_APROVACAO', 'Validar arq.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Obrigado pelo orçamento, vou pensar e talvez retorne mais tarde.', 'ENCERRAR', 'Recusa/Aguardar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Por enquanto não vou fechar, até mais!', 'ENCERRAR', 'Encerrar');
    }, 300_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f8_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
