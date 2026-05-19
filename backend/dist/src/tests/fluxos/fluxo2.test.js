"use strict";
/**
 * Fluxo 2 · Dúvida sobre produto antes de decidir
 * Cliente indeciso: "Não sei se quero panfleto ou flyer."
 * Precisa de orientação antes de fechar as specs. Retorna ao fluxo após esclarecer.
 *
 * Estados: Boas-vindas → Identificar → Esclarecer → Identificar →
 *          Coletar specs → Validar arq. → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(2);
const NAME = 'Bruno Teste F2';
describe('Fluxo 2 · Dúvida sobre produto antes de decidir', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve esclarecer dúvida e retomar fluxo normal', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi, boa tarde! Preciso de um material impresso.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Não sei se quero panfleto ou flyer, qual a diferença?', 'ESCLARECER_DUVIDA', 'Identificar → Esclarecer', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Qual é a diferença técnica entre panfleto e flyer?', 'ESCLARECER_DUVIDA', 'Esclarecer dúvida', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Entendi! Então vou de panfleto mesmo.', 'COLETAR_ESPECIFICACOES', 'Retorna Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Quero 500 unidades, tamanho A4, só frente, colorido, papel couchê 115g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
        await (0, helpers_1.turno)(PHONE, NAME, 'Sim, tenho o arquivo pronto em PDF com resolução 300 dpi.', 'AGUARDAR_APROVACAO', 'Validar arq.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular o valor para mim?', 'AGUARDAR_APROVACAO', 'Calcular', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Gostei do orçamento, aprovado!', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Quero entrega. Meu endereço é Av. Brasil, 500, São Paulo – SP.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
        await (0, helpers_1.turno)(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode fechar o pedido.', 'ENCERRAR', 'Gerar O.S.', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Obrigado! Até logo.', 'ENCERRAR', 'Encerrar');
    }, 130_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f2_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
    it('deve responder a entrada incompleta', async () => {
        await (0, helpers_1.sendMsg)(PHONE, NAME, '?');
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 20_000);
});
