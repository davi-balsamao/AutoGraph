"use strict";
/**
 * Fluxo 15 · Regra de negócio bloqueia temporariamente
 *
 * Cliente quer 20 unidades, mas o mínimo para panfletos é 100.
 * Agente mantém o fluxo em COLETAR_ESPECIFICACOES.
 * Cliente ajusta para 100 panfletos e repete as specs essenciais.
 *
 * Estados:
 * Boas-vindas → Identificar → Coletar specs → bloqueio qtd mínima →
 * Specs corrigidas → Validar arquivo → Aprovação admin
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(15);
const NAME = 'Oscar Teste F15';
describe('Fluxo 15 · Quantidade abaixo do mínimo', () => {
    beforeAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    afterAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    it('deve informar quantidade mínima, ajustar e seguir para aprovação admin', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, 'Oi! Quero fazer 20 panfletos para testar.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas + qtd baixa');
        await (0, helpers_1.turno)(PHONE, NAME, 'Panfletos para uma campanha pequena da minha empresa.', 'COLETAR_ESPECIFICACOES', 'Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, 'Só 20 unidades, tamanho A5, só frente colorida e verso em branco, couchê 90g.', 'COLETAR_ESPECIFICACOES', 'Coletar specs → qtd mínima');
        await (0, helpers_1.turno)(PHONE, NAME, 'Então faço 100 panfletos, tamanho A5, só frente colorida, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Specs corrigidas');
        /**
         * Aqui não usamos turno(), porque ao entrar em AGUARDAR_APROVACAO_ADMIN
         * a FSM pode pausar sem enviar resposta nova ao cliente.
         */
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Tenho o arquivo em PDF.');
        await (0, helpers_1.wait)(30_000);
        const stateAprovacaoAdmin = await (0, helpers_1.getSessionState)(PHONE);
        console.log('\n[Validar arq. → aprovação admin]');
        console.log('  Cliente: "Tenho o arquivo em PDF."');
        console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);
        expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular com 100 unidades.', 'AGUARDAR_APROVACAO_ADMIN', 'Follow-up enquanto aguarda admin', 30_000);
    }, 130_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f15_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
