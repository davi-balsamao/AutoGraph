"use strict";
/**
 * Helpers compartilhados para testes de fluxo.
 *
 * Premissas:
 *  - O servidor já está rodando (testes são E2E contra processo separado).
 *  - USE_MOCK_WHATSAPP=true deve estar definido no servidor para evitar chamadas
 *    reais à API da Meta.
 *  - APP_SECRET no servidor deve coincidir com process.env.APP_SECRET | 'test_secret'.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wait = exports.BASE_URL = void 0;
exports.buildPayload = buildPayload;
exports.sendMsg = sendMsg;
exports.getLastBotResponse = getLastBotResponse;
exports.getLastBotMessageId = getLastBotMessageId;
exports.cleanupUser = cleanupUser;
exports.getSessionState = getSessionState;
exports.getSessionContext = getSessionContext;
exports.getLastOS = getLastOS;
exports.uniquePhone = uniquePhone;
exports.turno = turno;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../../config/prisma");
exports.BASE_URL = `http://127.0.0.1:${process.env.PORT || 3000}`;
const APP_SECRET = process.env.APP_SECRET || 'test_secret';
/** Cria payload no formato do webhook da Meta. */
function buildPayload(from, name, text, msgId) {
    return {
        object: 'whatsapp_business_account',
        entry: [{
                id: '123',
                changes: [{
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: { display_phone_number: '15551234567', phone_number_id: '123456' },
                            contacts: [{ profile: { name }, wa_id: from }],
                            messages: [{
                                    from,
                                    id: msgId || `wamid.test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                                    timestamp: String(Math.floor(Date.now() / 1000)),
                                    text: { body: text },
                                    type: 'text',
                                }],
                        },
                        field: 'messages',
                    }],
            }],
    };
}
/** Envia mensagem via webhook com assinatura HMAC válida. */
async function sendMsg(from, name, text, msgId) {
    const payload = buildPayload(from, name, text, msgId);
    const bodyString = JSON.stringify(payload);
    const signature = 'sha256=' + crypto_1.default.createHmac('sha256', APP_SECRET).update(bodyString).digest('hex');
    const res = await fetch(`${exports.BASE_URL}/webhook`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': signature,
        },
        body: bodyString,
    });
    if (!res.ok)
        throw new Error(`Webhook rejeitou a requisição: ${res.status}`);
}
/** Retorna o texto da última resposta do BOT para o telefone dado. */
async function getLastBotResponse(telefone) {
    const lastMsg = await getLastBotMessage(telefone);
    if (!lastMsg)
        return null;
    const payload = lastMsg.payload;
    return payload.text?.body ?? payload.text ?? JSON.stringify(payload);
}
/** Retorna o ID da última mensagem do BOT (ou null se não houver). */
async function getLastBotMessageId(telefone) {
    const lastMsg = await getLastBotMessage(telefone);
    return lastMsg?.id ?? null;
}
async function getLastBotMessage(telefone) {
    const cliente = await prisma_1.prisma.usuario.findFirst({ where: { telefone } });
    if (!cliente)
        return null;
    return prisma_1.prisma.mensagens.findFirst({
        where: { usuarioId: cliente.id, origem: 'BOT' },
        orderBy: { criadoEm: 'desc' },
    });
}
/**
 * Remove todos os dados do usuário de teste do banco.
 * Deve ser chamado em beforeAll E afterAll para garantir estado limpo
 * mesmo que a execução anterior tenha sido interrompida.
 */
async function cleanupUser(telefone) {
    const user = await prisma_1.prisma.usuario.findFirst({ where: { telefone } });
    if (!user)
        return;
    // Respeita FK: mensagens → ordensDeServico → sessaoAtendimento → usuario
    await prisma_1.prisma.mensagens.deleteMany({ where: { usuarioId: user.id } });
    await prisma_1.prisma.sessaoAtendimento.deleteMany({ where: { clienteId: user.id } });
    await prisma_1.prisma.ordensDeServico.deleteMany({ where: { clienteId: user.id } });
    await prisma_1.prisma.usuario.delete({ where: { id: user.id } });
}
/** Retorna o estado FSM atual da sessão ativa do usuário. */
async function getSessionState(telefone) {
    const cliente = await prisma_1.prisma.usuario.findFirst({ where: { telefone } });
    if (!cliente)
        return null;
    const sessao = await prisma_1.prisma.sessaoAtendimento.findFirst({
        where: { clienteId: cliente.id, ativa: true },
        orderBy: { atualizadoEm: 'desc' },
    });
    return sessao?.estadoAtual ?? null;
}
/** Retorna o contexto JSON da sessão ativa (produto, specs, orcamento, entrega, osId…). */
async function getSessionContext(telefone) {
    const cliente = await prisma_1.prisma.usuario.findFirst({ where: { telefone } });
    if (!cliente)
        return null;
    const sessao = await prisma_1.prisma.sessaoAtendimento.findFirst({
        where: { clienteId: cliente.id, ativa: true },
        orderBy: { atualizadoEm: 'desc' },
    });
    return sessao?.contexto ?? null;
}
/** Retorna a última OS criada para o telefone dado. */
async function getLastOS(telefone) {
    const cliente = await prisma_1.prisma.usuario.findFirst({ where: { telefone } });
    if (!cliente)
        return null;
    return prisma_1.prisma.ordensDeServico.findFirst({
        where: { clienteId: cliente.id },
        orderBy: { criadoEm: 'desc' },
    });
}
/** Aguarda processamento assíncrono da IA (em ms). */
const wait = (ms = 8000) => new Promise(r => setTimeout(r, ms));
exports.wait = wait;
/** Gera número de telefone único por fluxo para evitar colisões entre suites. */
function uniquePhone(fluxoId) {
    const suffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `5531${fluxoId.toString().padStart(2, '0')}${suffix}`;
}
/**
 * Envia mensagem e faz polling do estado + resposta a cada 1.5s até bater o
 * esperado ou expirar o timeout. Falha (expect) se o estado divergir, e por
 * padrão também falha se nenhuma resposta nova do bot for emitida.
 *
 * Tolerante a variações de latência do LLM/embedding.
 */
async function turno(phone, name, text, expectedState, label, optionsOrTimeoutMs = {}) {
    const opts = typeof optionsOrTimeoutMs === 'number'
        ? { timeoutMs: optionsOrTimeoutMs }
        : optionsOrTimeoutMs;
    const timeoutMs = opts.timeoutMs ?? 45_000;
    const expectNewResponse = opts.expectNewResponse ?? true;
    const beforeBotMsgId = await getLastBotMessageId(phone);
    await sendMsg(phone, name, text);
    const deadline = Date.now() + timeoutMs;
    let state = null;
    let resp = null;
    let respIsNew = false;
    while (Date.now() < deadline) {
        await (0, exports.wait)(1_500);
        state = await getSessionState(phone);
        const currentMsgId = await getLastBotMessageId(phone);
        respIsNew = currentMsgId !== null && currentMsgId !== beforeBotMsgId;
        resp = await getLastBotResponse(phone);
        const stateOk = state === expectedState;
        const respOk = expectNewResponse ? respIsNew : true;
        if (stateOk && respOk)
            break;
    }
    console.log(`\n[${label}]`);
    console.log(`  Cliente: "${text}"`);
    console.log(`  Estado : ${state}  (esperado: ${expectedState})`);
    console.log(`  Bot    : ${resp}${expectNewResponse && !respIsNew ? '  ⚠️ (resposta NÃO renovada)' : ''}`);
    expect(state).toBe(expectedState);
    expect(resp).toBeTruthy();
    if (expectNewResponse) {
        expect(respIsNew).toBe(true);
    }
    return { state: state, resp: resp };
}
