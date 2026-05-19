"use strict";
/**
 * Fluxo 12 · Condição financeira influencia decisão
 * Cliente precisa parcelar antes de decidir. Agente informa as opções.
 * Com base nisso, cliente decide avançar com o pedido.
 *
 * Estados: Boas-vindas → Identificar → Esclarecer pag? → Coletar specs →
 *          Calcular → Apresentar → Aguardar aprov. → Dados entrega →
 *          Confirmar → Gerar O.S. → Encerrar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(12);
const NAME = 'Luana Teste F12';
describe('Fluxo 12 · Dúvida sobre pagamento antes de decidir', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve informar formas de pagamento e fechar o pedido', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Tenho uma dúvida sobre pagamento antes de fazer o pedido.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Quero panfletos, mas primeiro preciso saber se posso parcelar.', 'ESCLARECER_DUVIDA', 'Identificar + Esclarecer pag.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Vocês aceitam parcelamento no cartão? Em quantas vezes?', 'ESCLARECER_DUVIDA', 'Esclarecer pagamento');
        await (0, helpers_1.turno)(PHONE, NAME, 'Ótimo, então posso parcelar. Quero fazer panfletos.', 'COLETAR_ESPECIFICACOES', 'Coletar specs');
        await (0, helpers_1.turno)(PHONE, NAME, '1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Specs completas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Sim, tenho o arquivo de arte em PDF.', 'AGUARDAR_APROVACAO', 'Validar arq.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular o orçamento.', 'AGUARDAR_APROVACAO', 'Calcular', 60_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Aprovado! Vou parcelar em 3x.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Entrega no endereço: Rua XV de Novembro, 50, Curitiba – PR.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
        await (0, helpers_1.turno)(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 60_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Obrigada!', 'ENCERRAR', 'Encerrar');
    }, 500_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f12_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
