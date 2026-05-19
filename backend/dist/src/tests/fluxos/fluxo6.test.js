"use strict";
/**
 * Fluxo 6 · Interrupção e reengajamento tardio
 * Cliente inicia a coleta de specs e desaparece. Agente envia lembrete.
 * Cliente retorna e o fluxo é retomado exatamente de onde parou.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Ag. retorno →
 *          Coletar specs → Validar arq. → Calcular → Apresentar →
 *          Aguardar aprov. → Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(6);
const NAME = 'Fábio Teste F6';
describe('Fluxo 6 · Interrupção e reengajamento', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve retomar o fluxo de onde parou após o cliente retornar', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi, boa tarde! Quero fazer cartões de visita.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Cartões de visita para minha empresa.', 'COLETAR_ESPECIFICACOES', 'Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Preciso de 500 unidades, padrão 9x5cm, frente colorida, papel couchê 300g.', 'COLETAR_ESPECIFICACOES', 'Coletar specs parcial');
        await (0, helpers_1.turno)(PHONE, NAME, 'Preciso parar por agora, continue meu pedido depois.', 'AGUARDAR_RETORNO', 'Interrupção → Ag. retorno');
        await (0, helpers_1.turno)(PHONE, NAME, 'Voltei! Pode continuar meu pedido de cartões de visita?', 'COLETAR_ESPECIFICACOES', 'Retomada');
        await (0, helpers_1.turno)(PHONE, NAME, 'Não, sem verniz e sem laminação.', 'VALIDAR_ARQUIVO', 'Finaliza specs');
        await (0, helpers_1.turno)(PHONE, NAME, 'Sim, tenho o arquivo de arte em PDF, resolução 300 dpi.', 'AGUARDAR_APROVACAO', 'Validar arq.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Aprovado!', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Entrega no endereço: Av. Paulista, 1000, São Paulo – SP.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
        await (0, helpers_1.turno)(PHONE, NAME, 'Confirmo o pedido.', 'ENCERRAR', 'Confirmar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode fechar.', 'ENCERRAR', 'Gerar O.S.', 300_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Muito obrigado! Até mais.', 'ENCERRAR', 'Encerrar');
    }, 500_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f6_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)(20_000); // Espera 20s para garantir que o timeout de 15s do LLM passe antes do cleanup
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 40_000);
});
