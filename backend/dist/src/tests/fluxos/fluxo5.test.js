"use strict";
/**
 * Fluxo 5 · Pergunta de preço antes das specs
 * "Quanto custa 1000 panfletos?" sem nenhum detalhe técnico.
 * Agente esclarece que precisa das specs antes, coleta tudo e apresenta orçamento.
 *
 * Estados: Boas-vindas → Identificar → Esclarecer preço? →
 *          Coletar specs → Calcular → Apresentar → Aguardar aprov. →
 *          Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(5);
const NAME = 'Eduarda Teste F5';
describe('Fluxo 5 · Atalho — pergunta de preço antes das specs', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve esclarecer necessidade de specs antes do preço e fechar o pedido', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Quanto custa 1000 panfletos?', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas + pergunta preço');
        await (0, helpers_1.turno)(PHONE, NAME, 'Preciso saber o preço de 1000 panfletos, me diz logo.', 'ESCLARECER_DUVIDA', 'Esclarecer preço', 40_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Ah, entendi que precisa das especificações. Quero panfletos então.', 'COLETAR_ESPECIFICACOES', 'Identificar', 40_000);
        await (0, helpers_1.turno)(PHONE, NAME, '1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs', 25_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Sim, tenho o arquivo em PDF pronto.', 'AGUARDAR_APROVACAO', 'Validar arq.', 40_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Aprovado! Esse valor está ótimo.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Vou retirar na loja.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
        await (0, helpers_1.turno)(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Obrigada!', 'ENCERRAR', 'Encerrar');
    }, 300_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f5_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)(20_000); // Espera 20s para garantir que o timeout de 15s do LLM passe antes do cleanup
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 40_000);
});
