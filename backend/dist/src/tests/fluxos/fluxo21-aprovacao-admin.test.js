"use strict";
/**
 * Fluxo 21 · Aprovação Admin do orçamento
 *
 * Para rodar este teste, o servidor PRECISA estar com
 * ADMIN_APPROVAL_REQUIRED=true. O test runner também precisa enxergar essa
 * variável — caso contrário o describe é pulado para não falhar localmente.
 *
 * Fluxo coberto:
 *   1. Cliente conversa até VALIDAR_ARQUIVO
 *   2. Confirma arquivo → chain CALCULAR_ORCAMENTO → AGUARDAR_APROVACAO_ADMIN
 *      · sessão pausada, propostaPendente persistida, nenhuma mensagem BOT
 *   3. Cliente manda follow-up → bot responde "Estou revisando..."
 *   4. Admin POST /api/propostas/:sessaoId/aprovar
 *      · FSM resume, manda mensagem do orçamento ao cliente
 *      · estado vira AGUARDAR_APROVACAO
 *   5. Cliente confirma + entrega + confirmação final → GERAR_OS cria OS
 */
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const prisma_1 = require("../../config/prisma");
const PHONE = (0, helpers_1.uniquePhone)(21);
const NAME = 'Carla Teste F21';
const ADMIN_APPROVAL_ENABLED = process.env.ADMIN_APPROVAL_REQUIRED === 'true';
const describeOrSkip = ADMIN_APPROVAL_ENABLED ? describe : describe.skip;
const turno = (text, expectedState, label, timeoutMs) => (0, helpers_1.turno)(PHONE, NAME, text, expectedState, label, timeoutMs);
async function findSessaoId(phone) {
    const cliente = await prisma_1.prisma.usuario.findFirst({ where: { telefone: phone } });
    if (!cliente)
        return null;
    const sessao = await prisma_1.prisma.sessaoAtendimento.findFirst({
        where: { clienteId: cliente.id, ativa: true },
        orderBy: { atualizadoEm: 'desc' },
    });
    return sessao?.id ?? null;
}
describeOrSkip('Fluxo 21 · Aprovação Admin do orçamento', () => {
    beforeAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    afterAll(async () => {
        await (0, helpers_1.cleanupUser)(PHONE);
    });
    it('pausa em AGUARDAR_APROVACAO_ADMIN e retoma após admin aprovar', async () => {
        // ── Conversa até VALIDAR_ARQUIVO ────────────────────────────────────────
        await turno('Oi, boa tarde! Gostaria de fazer um pedido de impressão.', 'IDENTIFICAR_NECESSIDADE', 'Boas-vindas');
        await turno('Quero panfletos para divulgar meu restaurante.', 'COLETAR_ESPECIFICACOES', 'Identificar produto');
        await turno('Preciso de 1000 unidades, tamanho A5, frente e verso colorido, papel couchê 90g.', 'VALIDAR_ARQUIVO', 'Coletar specs');
        // ── Confirma arquivo → CALCULAR chain → AGUARDAR_APROVACAO_ADMIN ────────
        // Não usa turnoHelper aqui porque a IA NÃO manda mensagem nova (pausa).
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'Sim, tenho o arquivo de arte finalizada em PDF.');
        // Aguarda a transição assíncrona acontecer
        const deadline = Date.now() + 20_000;
        let state = null;
        while (Date.now() < deadline) {
            await (0, helpers_1.wait)(1_500);
            state = await (0, helpers_1.getSessionState)(PHONE);
            if (state === 'AGUARDAR_APROVACAO_ADMIN')
                break;
        }
        expect(state).toBe('AGUARDAR_APROVACAO_ADMIN');
        const ctx = await (0, helpers_1.getSessionContext)(PHONE);
        expect(ctx?.propostaPendente).toBeTruthy();
        expect(ctx?.propostaPendente.orcamento.total).toBeGreaterThan(0);
        const osAntes = await (0, helpers_1.getLastOS)(PHONE);
        expect(osAntes).toBeNull();
        // ── Cliente manda follow-up → recebe "estou revisando" 1x ────────────────
        await (0, helpers_1.sendMsg)(PHONE, NAME, 'E aí, sai logo esse preço?');
        await (0, helpers_1.wait)(6_000);
        const followup = await (0, helpers_1.getLastBotResponse)(PHONE);
        expect(followup).toMatch(/revisando|instantes/i);
        const ctxAposFollowup = await (0, helpers_1.getSessionContext)(PHONE);
        expect(ctxAposFollowup?.aguardandoFollowupEnviado).toBe(true);
        // ── Admin aprova via API ────────────────────────────────────────────────
        const sessaoId = await findSessaoId(PHONE);
        expect(sessaoId).not.toBeNull();
        const approveRes = await fetch(`${helpers_1.BASE_URL}/api/propostas/${sessaoId}/aprovar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        expect(approveRes.ok).toBe(true);
        const approveBody = await approveRes.json();
        expect(approveBody.estadoAtual).toBe('AGUARDAR_APROVACAO');
        expect(approveBody.mensagemEnviada).toMatch(/R\$|orçamento|valor/i);
        // ── Cliente aprova → entrega → confirma → OS criada ─────────────────────
        await turno('Aprovado! Pode continuar.', 'COLETAR_DADOS_ENTREGA', 'Aguardar aprovação');
        await turno('Vou retirar na loja, não preciso de entrega.', 'CONFIRMAR_PEDIDO', 'Dados de entrega');
        await turno('Confirmo o pedido.', 'ENCERRAR', 'Confirmar → Gerar OS', 30_000);
        const os = await (0, helpers_1.getLastOS)(PHONE);
        expect(os).not.toBeNull();
        expect(os.status).toBe('CRIADA');
    }, 180_000);
});
