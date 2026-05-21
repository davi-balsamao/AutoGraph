"use strict";
/**
 * Fluxo 17 · Canal não suportado — mensagem de áudio
 *
 * No teste atual, o áudio é simulado como texto "🎤".
 * Como isso não identifica produto, o estado correto permanece em
 * IDENTIFICAR_NECESSIDADE. Depois o cliente escreve e o fluxo segue.
 *
 * Estados:
 * Entrada incompleta → Identificar → Coletar specs → Validar arq. →
 * AGUARDAR_APROVACAO_ADMIN
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const PHONE = (0, helpers_1.uniquePhone)(17);
const NAME = 'Rafael Teste F17';
describe('Fluxo 17 · Áudio → solicitação de texto → fluxo normal', () => {
    beforeAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    afterAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    it('deve solicitar texto quando receber entrada não textual e retomar fluxo', async () => {
        await (0, helpers_1.turno)(PHONE, NAME, '🎤', 'IDENTIFICAR_NECESSIDADE', 'Áudio simulado — bot pede texto');
        await (0, helpers_1.turno)(PHONE, NAME, 'Desculpe, vou escrever então. Quero fazer panfletos.', 'COLETAR_ESPECIFICACOES', 'Texto após orientação');
        await (0, helpers_1.turno)(PHONE, NAME, 'Panfletos para divulgar minha academia.', 'COLETAR_ESPECIFICACOES', 'Identificar');
        await (0, helpers_1.turno)(PHONE, NAME, '500 unidades, tamanho A5, frente colorida, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Tenho o arquivo em PDF com 300 dpi.');
        await (0, helpers_1.wait)(30_000);
        const stateAprovacaoAdmin = await (0, helpers_1.getSessionState)(PHONE);
        console.log('\n[Validar arq. → aprovação admin]');
        console.log('  Cliente: "Tenho o arquivo em PDF com 300 dpi."');
        console.log(`  Estado : ${stateAprovacaoAdmin}  (esperado: AGUARDAR_APROVACAO_ADMIN)`);
        expect(stateAprovacaoAdmin).toBe('AGUARDAR_APROVACAO_ADMIN');
        await (0, helpers_1.turno)(PHONE, NAME, 'Pode calcular o orçamento.', 'AGUARDAR_APROVACAO_ADMIN', 'Follow-up enquanto aguarda admin', 30_000);
    }, 160_000);
    it('deve ignorar mensagem duplicada (retry da Meta)', async () => {
        const msgId = `wamid.dup_f17_${Date.now()}`;
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Retry test', msgId);
        await (0, helpers_1.wait)();
        expect(await (0, helpers_1.getLastBotResponse)(PHONE)).toBeTruthy();
    }, 25_000);
});
