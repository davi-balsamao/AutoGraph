"use strict";
/**
 * Fluxo 9 · Formato de arquivo incompatível
 * Cliente envia .PSD com camadas abertas. Agente rejeita, explica os formatos
 * aceitos e orienta a exportar para PDF/JPG antes de seguir.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Validar arq. ❌ fmt →
 *          Coletar specs → Validar arq. ✓ → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(9);
const NAME = 'Isabela Teste F9';
describe('Fluxo 9 · Arquivo em formato incompatível (.PSD)', () => {
    jest.setTimeout(360_000);
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve rejeitar .PSD e retomar após reenvio no formato correto', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Quero fazer flyers para uma promoção.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Flyers para uma promoção de verão da minha loja.', 'COLETAR_ESPECIFICACOES', 'Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, '500 unidades, tamanho A5, frente colorida, papel couchê 115g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
        await (0, helpers_1.turno)(PHONE, NAME, 'Tenho o arquivo de arte em .PSD com todas as camadas abertas.', 'VALIDAR_ARQUIVO', 'Validar arq. ❌ fmt PSD');
        await (0, helpers_1.turno)(PHONE, NAME, 'Entendi, vou exportar para PDF. Pode aguardar.', 'ESCLARECER_DUVIDA', 'Orientação formato', 90_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Agora reenviei o arquivo em PDF com as camadas achatadas.', 'AGUARDAR_APROVACAO', 'Validar arq. ✓');
        await (0, helpers_1.turno)(PHONE, NAME, 'Aprovado!', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Vou retirar na loja.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
        await (0, helpers_1.turno)(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Obrigada! Até mais.', 'ENCERRAR', 'Encerrar');
    }, 360_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f9_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
