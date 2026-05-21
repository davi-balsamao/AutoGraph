"use strict";
/**
 * Handler do estado CONFIRMAR_PEDIDO.
 *
 * Resumo determinístico — montado a partir de `sessao.contexto`.
 * Não usa RAG aqui para evitar invenção de dados.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmarPedidoHandler = exports.ConfirmarPedidoHandler = void 0;
const states_1 = require("../states");
const base_handler_1 = require("./base.handler");
const CONFIRMAR_RE = /\b(confirmo|confirmado|aprovo|aprovado|pode gerar|pode fazer|pode emitir|fechado|tá certo|ta certo|esta certo|está certo|isso mesmo|isso ai|isso aí|combinado)\b/i;
const CORRIGIR_RE = /\b(errado|corrige|corrigir|trocar|mudar|alterar|n[ãa]o é isso|n[ãa]o é assim|refazer|outra coisa)\b/i;
const CAMPOS_INTERNOS = [
    'formaPagamentoPreferida',
    'forma pagamento preferida',
    'estadoSalvoTakeover',
    'offTopicCount',
];
function normalizarTexto(valor) {
    return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[?:.\s]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function formatarMoeda(valor) {
    if (!valor || valor <= 0)
        return 'a definir';
    return valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}
function limparPergunta(pergunta) {
    return pergunta
        .replace(/\?+$/g, '')
        .replace(/:+$/g, '')
        .trim();
}
function deveOcultarSpec(chave) {
    const chaveNorm = normalizarTexto(chave);
    return CAMPOS_INTERNOS.some((campo) => {
        const campoNorm = normalizarTexto(campo);
        return chaveNorm === campoNorm || chaveNorm.includes(campoNorm);
    });
}
function formatarSpecs(specs) {
    if (!specs || Object.keys(specs).length === 0) {
        return '— sem especificações detalhadas';
    }
    const linhas = Object.entries(specs)
        .filter(([pergunta, resposta]) => {
        if (deveOcultarSpec(pergunta))
            return false;
        if (!resposta || !String(resposta).trim())
            return false;
        return true;
    })
        .map(([pergunta, resposta]) => `   • ${limparPergunta(pergunta)}: ${resposta}`);
    return linhas.length > 0 ? linhas.join('\n') : '— sem especificações detalhadas';
}
function formatarEntrega(entrega) {
    if (!entrega?.modalidade)
        return 'a definir';
    if (entrega.modalidade === 'retirada')
        return 'Retirada na loja';
    return entrega.endereco
        ? `Entrega em: ${entrega.endereco}`
        : 'Entrega (endereço a confirmar)';
}
function obterFormaPagamento(context) {
    const specs = context.specs || {};
    const direta = specs['formaPagamentoPreferida'];
    if (direta)
        return direta;
    const encontrada = Object.entries(specs).find(([chave]) => normalizarTexto(chave).includes('forma pagamento'));
    return encontrada?.[1] || null;
}
function montarResumo(context) {
    const produto = context.produto || 'Produto não identificado';
    const specs = formatarSpecs(context.specs);
    const total = formatarMoeda(context.orcamento?.total);
    const prazo = context.orcamento?.prazo || 'a definir';
    const entrega = formatarEntrega(context.entrega);
    const formaPagamento = obterFormaPagamento(context);
    const linhas = [
        'Vamos confirmar seu pedido:',
        `📦 *Produto*: ${produto}`,
        `📋 *Especificações*:\n${specs}`,
        `💰 *Valor total*: ${total}`,
        `⏱️ *Prazo de produção*: ${prazo}`,
        `🚚 *Entrega*: ${entrega}`,
    ];
    if (formaPagamento) {
        linhas.push(`💳 *Pagamento*: ${formaPagamento}`);
    }
    linhas.push('', 'Confirma este pedido?');
    return linhas.join('\n');
}
class ConfirmarPedidoHandler {
    async handle(message, sessao, deps) {
        const { context } = await (0, base_handler_1.prepareContext)(message, sessao, deps);
        const msg = message.trim();
        if (!msg) {
            return {
                response: montarResumo(context),
                nextState: states_1.ConversationState.CONFIRMAR_PEDIDO,
                updatedContext: context,
            };
        }
        if (CONFIRMAR_RE.test(msg)) {
            return {
                response: '',
                nextState: states_1.ConversationState.GERAR_OS,
                updatedContext: context,
                chainNext: states_1.ConversationState.GERAR_OS,
            };
        }
        if (CORRIGIR_RE.test(msg)) {
            return {
                response: 'Sem problema! Me diga o que precisa ajustar e eu refaço o orçamento.',
                nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
                updatedContext: context,
            };
        }
        return {
            response: montarResumo(context),
            nextState: states_1.ConversationState.CONFIRMAR_PEDIDO,
            updatedContext: context,
        };
    }
}
exports.ConfirmarPedidoHandler = ConfirmarPedidoHandler;
exports.confirmarPedidoHandler = new ConfirmarPedidoHandler();
