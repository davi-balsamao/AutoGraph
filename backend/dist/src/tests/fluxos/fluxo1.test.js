"use strict";
/**
 * Fluxo 1 · Fluxo base — sem desvios
 *
 * Cada turno valida TRÊS coisas:
 *   1. Estado FSM persistido no DB (para imediatamente se errar)
 *   2. Resposta do bot não vazia
 *   3. Conteúdo esperado nos checkpoints críticos (preço, código de OS)
 *
 * Estados esperados:
 *   BOAS_VINDAS
 *   → IDENTIFICAR_NECESSIDADE
 *   → COLETAR_ESPECIFICACOES
 *   → VALIDAR_ARQUIVO
 *   → [chain: CALCULAR → APRESENTAR] → AGUARDAR_APROVACAO
 *   → COLETAR_DADOS_ENTREGA
 *   → CONFIRMAR_PEDIDO
 *   → [chain: GERAR_OS] → ENCERRAR
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(1);
const NAME = 'Ana Teste F1';
/** Wrapper que fixa PHONE e NAME para não repetir em cada chamada. */
const turno = (text, expectedState, label, timeoutMs) => (0, helpers_1.turno)(PHONE, NAME, text, expectedState, label, timeoutMs);
describe('Fluxo 1 · Fluxo base — sem desvios', () => {
    beforeAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    afterAll(async () => { await (0, helpers_1.cleanupUser)(PHONE); });
    it('deve percorrer o fluxo completo respeitando estado e conteúdo em cada turno', async () => {
        // ── Turno 1: Boas-vindas ────────────────────────────────────────────────
        await turno('Oi, boa tarde! Gostaria de fazer um pedido de impressão.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        // ── Turno 2: Identificar produto ────────────────────────────────────────
        await turno('Quero panfletos para divulgar meu restaurante.', 'COLETAR_ESPECIFICACOES', 'Identificar produto');
        // ── Turno 3: Coletar specs ───────────────────────────────────────────────
        await turno('Preciso de 1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
        // Verifica que as specs foram salvas no contexto
        const ctxAposSpecs = await (0, helpers_1.getSessionContext)(PHONE);
        console.log('  Contexto após specs:', JSON.stringify(ctxAposSpecs, null, 2));
        expect(ctxAposSpecs?.produto?.toLowerCase()).toContain('panfleto');
        // ── Turno 4: Validar arquivo → (chain) Calcular → Apresentar ────────────
        // Este turno dispara 3 estados internos automáticos. Aguarda mais tempo.
        const { resp: respAprovacao } = await turno('Sim, tenho o arquivo de arte finalizada em PDF.', 'AGUARDAR_APROVACAO', 'Validar arquivo → chain Calcular → Apresentar', 30_000);
        // Checkpoint crítico: o orçamento deve ter sido calculado e salvo no contexto
        const ctxAposCalculo = await (0, helpers_1.getSessionContext)(PHONE);
        console.log('  Contexto após cálculo:', JSON.stringify(ctxAposCalculo?.orcamento, null, 2));
        expect(ctxAposCalculo?.orcamento?.total).toBeGreaterThan(0);
        // A resposta enviada ao cliente deve conter o valor monetário
        expect(respAprovacao).toMatch(/R\$|orçamento|valor/i);
        // ── Turno 5: Aprovar orçamento ───────────────────────────────────────────
        await turno('Aprovado! Pode continuar.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprovação');
        // ── Turno 6: Dados de entrega ────────────────────────────────────────────
        await turno('Vou retirar na loja, não preciso de entrega.', 'CONFIRMAR_PEDIDO', 'Dados de entrega');
        // Verifica que a modalidade foi salva
        const ctxAposEntrega = await (0, helpers_1.getSessionContext)(PHONE);
        console.log('  Entrega:', JSON.stringify(ctxAposEntrega?.entrega, null, 2));
        expect(ctxAposEntrega?.entrega?.modalidade).toBe('retirada');
        // ── Turno 7: Confirmar → (chain) Gerar O.S. → Encerrar ──────────────────
        // GERAR_OS chama LLM para mensagem sugerida — aguarda mais tempo.
        const { resp: respEncerrar } = await turno('Confirmo o pedido.', 'ENCERRAR', 'Confirmar → chain Gerar O.S. → Encerrar', 30_000);
        // Checkpoint crítico: a O.S. deve ter sido criada no banco
        const os = await (0, helpers_1.getLastOS)(PHONE);
        console.log('  O.S. criada:', os ? `ID ${os.id.slice(0, 8).toUpperCase()}` : 'NENHUMA');
        expect(os).not.toBeNull();
        // Fase 2: observações ficam vazias por padrão — validação técnica de arte
        // é responsabilidade da recepcionista, não do bot (validar-arquivo.md).
        expect(os.observacoes ?? '').toBe('');
        // A resposta deve mencionar a Ordem de Serviço
        expect(respEncerrar).toMatch(/ordem de servi[çc]o|O\.S\.|OS/i);
    }, 90_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f1_${Date.now()}`;
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
