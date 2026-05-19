"use strict";
/**
 * Fluxo 13 · Ausência de histórico acessível
 * Cliente recorrente quer repetir pedido anterior. Bot não acessa histórico.
 * Informa isso com educação e reconduz para nova coleta de specs.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs re-coletar →
 *          Validar arq. → Calcular → Apresentar → Aguardar aprov. →
 *          Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(13);
const NAME = 'Marcos Teste F13';
describe('Fluxo 13 · Cliente recorrente sem acesso ao histórico', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve informar falta de histórico e recoletcar specs do zero', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Quero repetir o mesmo pedido que fiz no mês passado.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas + pedido repetir');
        await (0, helpers_1.turno)(PHONE, NAME, 'Era panfletos, exatamente igual ao anterior.', 'COLETAR_ESPECIFICACOES', 'Identificar → re-coletar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Tudo bem, vou informar de novo. Quero panfletos para minha empresa.', 'COLETAR_ESPECIFICACOES', 'Re-coletar specs');
        await (0, helpers_1.turno)(PHONE, NAME, '1000 unidades, tamanho A5, frente e verso colorido, couchê 90g.', 'VALIDAR_ARQUIVO', 'Specs completas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Tenho o arquivo de arte em PDF, igual ao anterior.', 'AGUARDAR_APROVACAO', 'Validar arq.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular.', 'AGUARDAR_APROVACAO', 'Calcular', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Aprovado!', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Vou retirar na loja física, não preciso de entrega.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
        await (0, helpers_1.turno)(PHONE, NAME, 'Sim, confirmo o pedido! Todos os dados estão corretos, inclusive a retirada na loja.', 'ENCERRAR', 'Confirmar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Obrigado! Até o próximo pedido.', 'ENCERRAR', 'Encerrar');
    }, 120_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f13_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
