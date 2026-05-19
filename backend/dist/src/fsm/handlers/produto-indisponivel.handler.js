"use strict";
/**
 * Handler do estado PRODUTO_INDISPONIVEL.
 *
 * Contrato ([rag-test/estados/produto-indisponivel.md] + Regra 11):
 *  • Informar diretamente que o produto não é oferecido
 *  • Sugerir produto similar do catálogo se existir
 *  • NÃO inventar produtos, preços ou prazos
 *
 * Transições:
 *  → IDENTIFICAR_NECESSIDADE — cliente aceita alternativa que existe no catálogo
 *  → ENCERRAR — cliente rejeita ou não há alternativa adequada
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.produtoIndisponivelHandler = exports.ProdutoIndisponivelHandler = void 0;
const entity_extraction_service_1 = require("../../services/entity-extraction.service");
const catalog_util_1 = require("../catalog.util");
const states_1 = require("../states");
const base_handler_1 = require("./base.handler");
const RECUSA_RE = /\b(n[ãa]o (quero|preciso|vou|tenho)|deixa pra l[áa]|esquece|t[áa] bom assim|sem interesse|obrigad[oa] mesmo assim)\b/i;
function listarCatalogo() {
    const itens = (0, catalog_util_1.getCatalog)().map((c) => `• ${c.produto}`);
    if (itens.length === 0)
        return '';
    return itens.join('\n');
}
class ProdutoIndisponivelHandler {
    async handle(message, sessao, deps) {
        const { context, entities } = await (0, base_handler_1.prepareContext)(message, sessao, deps);
        const msg = message.trim();
        // Cliente identificou produto válido do catálogo → retoma fluxo.
        const produtoNaMsg = entity_extraction_service_1.entityExtractionService.identificarProdutoNaMensagem(msg);
        if (produtoNaMsg || entities.produtoIdentificado) {
            return {
                response: '',
                nextState: states_1.ConversationState.IDENTIFICAR_NECESSIDADE,
                updatedContext: context,
                chainNext: states_1.ConversationState.IDENTIFICAR_NECESSIDADE,
            };
        }
        if (RECUSA_RE.test(msg)) {
            return {
                response: 'Tudo bem! Se precisar de algo do nosso catálogo, é só chamar. Bom dia!',
                nextState: states_1.ConversationState.ENCERRAR,
                updatedContext: context,
            };
        }
        // Entrada padrão: lista o catálogo e pergunta se algum interessa.
        const catalogo = listarCatalogo();
        const response = catalogo
            ? `Esse item não está no nosso catálogo. O que oferecemos é:\n${catalogo}\nAlgum desses te interessa?`
            : 'Esse item não está no nosso catálogo. Posso te ajudar com outro tipo de impressão?';
        return {
            response,
            nextState: states_1.ConversationState.PRODUTO_INDISPONIVEL,
            updatedContext: context,
        };
    }
}
exports.ProdutoIndisponivelHandler = ProdutoIndisponivelHandler;
exports.produtoIndisponivelHandler = new ProdutoIndisponivelHandler();
