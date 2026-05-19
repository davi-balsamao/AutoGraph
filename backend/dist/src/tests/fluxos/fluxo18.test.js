"use strict";
/**
 * Fluxo 18 · Idioma diferente do configurado
 * Cliente escreve em espanhol. Agente detecta, responde bilíngue e pede
 * para continuar em português. Fluxo segue normalmente.
 *
 * Estados: Boas-vindas es → Identificar bilíngue → Coletar specs →
 *          Calcular → Apresentar → Aguardar aprov. → Dados entrega →
 *          Confirmar → Gerar O.S. → Encerrar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(18);
const NAME = 'Sebastião Teste F18';
describe('Fluxo 18 · Atendimento em espanhol → redirecionamento para português', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve detectar espanhol, redirecionar para português e fechar o pedido', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, '¡Hola! Quiero hacer un pedido de impresión, folletos para mi negocio.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas em espanhol');
        await (0, helpers_1.turno)(PHONE, NAME, 'Quiero folletos. Prefiero hablar en español si es posible.', 'COLETAR_ESPECIFICACOES', 'Identificar bilíngue');
        await (0, helpers_1.turno)(PHONE, NAME, 'Tudo bem, vou continuar em português então. Quero panfletos.', 'COLETAR_ESPECIFICACOES', 'Transição para PT');
        await (0, helpers_1.turno)(PHONE, NAME, '1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
        await (0, helpers_1.turno)(PHONE, NAME, 'Tenho o arquivo em PDF com resolução adequada.', 'AGUARDAR_APROVACAO', 'Validar arq.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular o orçamento.', 'AGUARDAR_APROVACAO', 'Calcular', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Aprovado!', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Vou retirar na loja.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
        await (0, helpers_1.turno)(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Obrigado! Hasta luego.', 'ENCERRAR', 'Encerrar');
    }, 300_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f18_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
