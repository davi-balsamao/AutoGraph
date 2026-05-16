import { entityExtractionService } from '../services/entity-extraction.service';
import { ConversationState } from './states';

export type SessionIntent =
  | { type: 'NONE' }
  | { type: 'NOVO_ATENDIMENTO' }
  | { type: 'TROCAR_PRODUTO'; produtoIdentificado: string | null };

/**
 * Fase 3 — Migração híbrida regex → LLM.
 *
 * Regex permanece apenas como GUARD EARLY-EXIT para casos óbvios em que
 * disparar o LLM é desperdício (latência + custo). A decisão real é
 * delegada ao `EntityExtractionService` (que internamente usa o LLM).
 *
 * Compartilhamento de cache: o resultado é guardado pelo extractor, então
 * a chamada posterior do handler (via `prepareContext`) é hit de cache.
 */
const NOVO_ATENDIMENTO_OBVIO = /^(cancela tudo|esquece tudo|recome[çc]ar do zero|come[çc]ar de novo)\b/i;

const SAUDACAO_REINICIO = /^(oi|olá|ola|bom dia|boa tarde|boa noite|opa|e aí|eai)[\s,!.]*$/i;

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

export async function detectSessionIntent(
  message: string,
  estadoAtual: ConversationState,
  conversationHistory: string,
  produtoAtual?: string | null
): Promise<SessionIntent> {
  const msg = message.trim();

  // Early-exit 1: padrão obvio de cancelamento.
  if (NOVO_ATENDIMENTO_OBVIO.test(msg)) {
    return { type: 'NOVO_ATENDIMENTO' };
  }

  // Early-exit 2: saudação isolada em estado avançado = reinício implícito.
  if (SAUDACAO_REINICIO.test(msg) && ESTADOS_COM_FLUXO_AVANCADO.has(estadoAtual)) {
    return { type: 'NOVO_ATENDIMENTO' };
  }

  // Caminho principal: LLM via EntityExtractionService.
  const entities = await entityExtractionService.extract(conversationHistory, {
    produtoAtual: produtoAtual ?? null,
  });

  if (entities.intent === 'NOVO_ATENDIMENTO') {
    return { type: 'NOVO_ATENDIMENTO' };
  }

  if (entities.intent === 'TROCAR_PRODUTO') {
    return {
      type: 'TROCAR_PRODUTO',
      produtoIdentificado: entities.produtoIdentificado,
    };
  }

  // Caso clássico: cliente menciona produto válido enquanto está em estado avançado.
  // Não é mais reconhecido como NOVO_PEDIDO porque o cliente pode estar respondendo
  // a uma pergunta — só consideramos troca quando o LLM marcou explicitamente.
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
