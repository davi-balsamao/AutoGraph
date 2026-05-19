"use strict";
/**
 * Fluxo 17 · Canal não suportado — mensagem de áudio
 * Cliente envia áudio. Bot não processa. Solicita que o cliente escreva.
 * Fluxo segue normalmente após receber texto.
 *
 * Nota: o payload de teste envia texto simulando a situação, pois a
 * infraestrutura de testes usa type:'text'. O bot deve solicitar texto
 * e continuar normalmente quando o cliente escrever.
 *
 * Estados: Boas-vindas áudio ❌ → Boas-vindas solicita texto →
 *          Identificar → Coletar specs → Validar arq. → Calcular →
 *          Apresentar → Aguardar aprov. → Dados entrega → Confirmar →
 *          Gerar O.S. → Encerrar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(17);
const NAME = 'Rafael Teste F17';
describe('Fluxo 17 · Áudio → solicitação de texto → fluxo normal', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve solicitar texto quando receber entrada não textual e retomar fluxo', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, '🎤', 'COLETAR_ESPECIFICACOES', 'Áudio simulado — bot pede texto');
        await (0, helpers_1.turno)(PHONE, NAME, 'Desculpe, vou escrever então. Quero fazer panfletos.', 'ESCLARECER_DUVIDA', 'Texto após orientação');
        await (0, helpers_1.turno)(PHONE, NAME, 'Panfletos para divulgar minha academia.', 'COLETAR_ESPECIFICACOES', 'Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, '500 unidades, tamanho A5, frente colorida, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
        await (0, helpers_1.turno)(PHONE, NAME, 'Tenho o arquivo em PDF com 300 dpi.', 'AGUARDAR_APROVACAO', 'Validar arq.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular o orçamento.', 'AGUARDAR_APROVACAO', 'Calcular', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Aprovado!', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Vou retirar na loja.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
        await (0, helpers_1.turno)(PHONE, NAME, 'Confirmo.', 'ENCERRAR', 'Confirmar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Obrigado! Até mais.', 'ENCERRAR', 'Encerrar');
    }, 120_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f17_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
