"use strict";
/**
 * Fluxo 4 · Urgência que altera custo e prazo
 *
 * Cliente precisa do material em 24 horas. Quando pergunta o preço enquanto
 * o bot ainda está validando o arquivo, o bot redireciona para ESCLARECER_DUVIDA
 * (preserva Regra 7 — arquivo validado antes do orçamento). Depois cliente
 * confirma arte → bot calcula → cliente negocia → aprova → entrega → OS.
 *
 * Estados: Boas-vindas → Identificar → Coletar specs → Validar arq. →
 *          ESCLARECER_DUVIDA (pergunta custo cedo) → Validar arq. ✓ →
 *          Calcular → Apresentar → Aguardar aprov. → Negociar → Aguardar aprov. →
 *          Dados entrega → Confirmar → Gerar O.S. → Encerrar
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(4);
const NAME = 'Diego Teste F4';
describe('Fluxo 4 · Urgência — entrega em 24h com negociação', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve esclarecer custo, validar arquivo, negociar e fechar o pedido', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Preciso de material com muita urgência, é para amanhã!', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await (0, helpers_1.turno)(PHONE, NAME, 'Preciso de panfletos para um evento que acontece amanhã cedo.', 'COLETAR_ESPECIFICACOES', 'Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, '500 unidades, tamanho A5, frente e verso colorido, papel couchê 90g. Preciso em 24 horas!', 'VALIDAR_ARQUIVO', 'Coletar specs urgente');
        // Cliente pergunta custo no estado VALIDAR_ARQUIVO — DUVIDA expandida (Fase 5)
        // roteia para ESCLARECER_DUVIDA. Bot via RAG explica que precisa do arquivo antes.
        await (0, helpers_1.turno)(PHONE, NAME, 'Qual o custo para entrega expressa em 24 horas?', 'ESCLARECER_DUVIDA', 'Pergunta custo cedo → Esclarecer', 30_000);
        // Cliente confirma que tem a arte → handler esclarecer-duvida sai por MOVING_FORWARD
        // e retorna ao estado anterior (VALIDAR_ARQUIVO), onde "Sim, tenho..." encadeia
        // CALCULAR → APRESENTAR → AGUARDAR_APROVACAO.
        await (0, helpers_1.turno)(PHONE, NAME, 'Entendi. Sim, tenho o arquivo de arte pronto em PDF.', 'AGUARDAR_APROVACAO', 'Confirma arte → chain Calcular', 30_000);
        await (0, helpers_1.turno)(PHONE, NAME, 'Nossa, ficou caro com essa urgência. Tem como reduzir um pouco?', 'NEGOCIAR', 'Negociar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Ok, entendo a situação. Aceito o valor então.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprov.');
        await (0, helpers_1.turno)(PHONE, NAME, 'Vou buscar na loja para agilizar.', 'CONFIRMAR_PEDIDO', 'Dados entrega');
        await (0, helpers_1.turno)(PHONE, NAME, 'Confirmo o pedido urgente.', 'ENCERRAR', 'Confirmar → Gerar O.S.', 30_000);
        // Após gerar OS, sessão fica em ENCERRAR — mensagens subsequentes recebem despedida.
        const os = await (0, helpers_1.getLastOS)(PHONE);
        expect(os).not.toBeNull();
        expect(os.especificacoes).toBeTruthy();
        await (0, helpers_1.turno)(PHONE, NAME, 'Obrigado! Até mais.', 'ENCERRAR', 'Encerrar');
    }, 150_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f4_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
