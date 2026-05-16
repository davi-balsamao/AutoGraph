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

import { entityExtractionService } from '../../services/entity-extraction.service';
import { getCatalog } from '../catalog.util';
import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationState, SessaoRecord } from '../states';
import { prepareContext } from './base.handler';

const RECUSA_RE = /\b(n[ãa]o (quero|preciso|vou|tenho)|deixa pra l[áa]|esquece|t[áa] bom assim|sem interesse|obrigad[oa] mesmo assim)\b/i;

function listarCatalogo(): string {
  const itens = getCatalog().map((c) => `• ${c.produto}`);
  if (itens.length === 0) return '';
  return itens.join('\n');
}

export class ProdutoIndisponivelHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const { context, entities } = await prepareContext(message, sessao, deps);
    const msg = message.trim();

    // Cliente identificou produto válido do catálogo → retoma fluxo.
    const produtoNaMsg = entityExtractionService.identificarProdutoNaMensagem(msg);
    if (produtoNaMsg || entities.produtoIdentificado) {
      return {
        response: '',
        nextState: ConversationState.IDENTIFICAR_NECESSIDADE,
        updatedContext: context,
        chainNext: ConversationState.IDENTIFICAR_NECESSIDADE,
      };
    }

    if (RECUSA_RE.test(msg)) {
      return {
        response: 'Tudo bem! Se precisar de algo do nosso catálogo, é só chamar. Bom dia!',
        nextState: ConversationState.ENCERRAR,
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
      nextState: ConversationState.PRODUTO_INDISPONIVEL,
      updatedContext: context,
    };
  }
}

export const produtoIndisponivelHandler = new ProdutoIndisponivelHandler();
