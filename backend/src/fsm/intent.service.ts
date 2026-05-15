import { entityExtractionService } from '../services/entity-extraction.service';
import { ConversationState } from './states';

export type SessionIntent =
  | { type: 'NONE' }
  | { type: 'NOVO_ATENDIMENTO' }
  | { type: 'TROCAR_PRODUTO'; produtoIdentificado: string | null };

const NOVO_ATENDIMENTO =
  /\b(novo atendimento|iniciar (um )?novo|começar do zero|começar de novo|recomeçar|zerar|outro pedido|atendimento novo|cancelar tudo|esqueç[ae] (tudo|o que falei|isso)|desistir desse pedido|outro atendimento)\b/i;

const TROCAR_PRODUTO =
  /\b(mud(ar|ei|ou) de (produto|ideia)|na verdade (quero|preciso)|não quero mais|nao quero mais|prefiro (fazer |imprimir )?|trocar (para|por)|agora quero|mudei de ideia|outro produto)\b/i;

const SAUDACAO_REINICIO =
  /^(oi|olá|ola|bom dia|boa tarde|boa noite|opa|e aí|eai)[\s,!.]*$/i;

/** Estados em que um "oi de novo" sugere recomeço, não só cumprimento. */
const ESTADOS_COM_FLUXO_AVANCADO = new Set<ConversationState>([
  ConversationState.COLETAR_ESPECIFICACOES,
  ConversationState.VALIDAR_ARQUIVO,
  ConversationState.CALCULAR_ORCAMENTO,
  ConversationState.APRESENTAR_ORCAMENTO,
  ConversationState.AGUARDAR_APROVACAO,
  ConversationState.NEGOCIAR,
  ConversationState.COLETAR_DADOS_ENTREGA,
  ConversationState.CONFIRMAR_PEDIDO,
  ConversationState.PRODUTO_INDISPONIVEL,
]);

export function detectSessionIntent(
  message: string,
  estadoAtual: ConversationState
): SessionIntent {
  const msg = message.trim();
  const msgLower = msg.toLowerCase();

  if (NOVO_ATENDIMENTO.test(msgLower)) {
    return { type: 'NOVO_ATENDIMENTO' };
  }

  // "quero fazer um banner" ≠ novo atendimento
  if (/\bquero fazer um\b/.test(msgLower) && entityExtractionService.identificarProdutoNaMensagem(msg)) {
    return { type: 'NONE' };
  }

  if (
    SAUDACAO_REINICIO.test(msg) &&
    ESTADOS_COM_FLUXO_AVANCADO.has(estadoAtual)
  ) {
    return { type: 'NOVO_ATENDIMENTO' };
  }

  const produtoNaMsg = entityExtractionService.identificarProdutoNaMensagem(msg);

  if (TROCAR_PRODUTO.test(msgLower)) {
    return {
      type: 'TROCAR_PRODUTO',
      produtoIdentificado: produtoNaMsg?.produto ?? null,
    };
  }

  if (
    produtoNaMsg &&
    (ESTADOS_COM_FLUXO_AVANCADO.has(estadoAtual) ||
      estadoAtual === ConversationState.IDENTIFICAR_NECESSIDADE) &&
    /\b(quero|preciso|fazer|orçamento|orcamento|na verdade|agora)\b/i.test(msgLower)
  ) {
    return {
      type: 'TROCAR_PRODUTO',
      produtoIdentificado: produtoNaMsg.produto,
    };
  }

  return { type: 'NONE' };
}

export function mensagemNovoAtendimento(): string {
  const h = new Date().getHours();
  const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  return `${saudacao}! Sem problema, começamos do zero. Como posso te ajudar?`;
}

export function mensagemTrocaProduto(produto: string | null): string {
  if (produto) {
    return `Tranquilo! Vamos montar o orçamento de ${produto} do início. Você tem a arte pronta?`;
  }
  return 'Sem problema! Qual produto você quer orçar agora?';
}
