/**
 * Base utility module aplicada a todos os 16 handlers da FSM.
 *
 * Centraliza as **15 Regras Gerais** (backend/rag-test/regras-gerais/regras-gerais.md)
 * em helpers reutilizáveis. Regras transversais (3, 9, 12, 13) também são chamadas
 * como middleware antes/depois do handler em state-router.ts.
 *
 * Não é classe abstrata: handlers já implementam `StateHandler`. Utility puro
 * é mais fácil de compor e testar.
 */

import {
  entityExtractionService,
  PedidoEntities,
} from '../../services/entity-extraction.service';
import { syncContextFromEntities } from '../context.util';
import { HandlerDeps } from '../handler.types';
import { ConversationContext, SessaoRecord } from '../states';
import { DUVIDA } from '../transition.service';

export type CrossCuttingIntent = 'DUVIDA' | 'ESCALAR' | 'NOVO' | 'PAUSA' | 'LISTAR_PEDIDOS' | null;

/**
 * Fluxo 20: mensagem fora do propósito do bot (piada, receita, futebol, etc.).
 * Lista conservadora — só termos que claramente não têm a ver com gráfica e
 * que não conflitam com vocabulário do domínio (não inclui "tempo", "papel"...).
 */
const OFF_TOPIC_RE =
  /\b(piada|piadas|receita|receitas|bolo|bolos|chocolate|futebol|m[úu]sica|m[úu]sicas|filme|filmes|s[ée]rie|s[ée]ries|hobby|hobbies|namorad[oa]s?|fofoca|cl[ií]ma|previs[ãa]o do tempo|signo|hor[óo]scopo)\b/i;

export function isOffTopicMessage(message: string): boolean {
  if (!message) return false;
  return OFF_TOPIC_RE.test(message);
}

// Fase 5: DUVIDA é fonte única em transition.service.ts (importada acima).
const ESCALAR_RE =
  /\b(atendente|humano|gerente|pessoa|falar com algu[ée]m)\b/i;
const NOVO_RE =
  /\b(novo atendimento|come[çc]ar de novo|reiniciar|outro pedido|esquece tudo|cancela tudo)\b/i;
// Pedido explícito de pausa — Regra 6 estendida (Fluxo 6).
const PAUSE_RE =
  /\b(preciso parar|vou parar|pausa|pausar|continue (meu pedido )?depois|retorno depois|volto (mais )?(tarde|depois)|n[ãa]o posso (agora|continuar)|ocupad[oa] agora|tenho que sair)\b/i;

// Cliente pergunta sobre o histórico de pedidos dele próprio. Cobre variações
// comuns: "meus pedidos", "que pedidos eu fiz", "histórico", "minhas OS".
// Importante: precisa rodar ANTES da DUVIDA, porque "quais pedidos" também
// poderia cair em pergunta aberta e ser jogado pro RAG.
const LISTAR_PEDIDOS_RE =
  /\b(meus pedidos|minhas (ordens|os|encomendas|compras)|que (pedidos|ordens|encomendas) eu (j[áa] )?fiz|quais (pedidos|ordens|encomendas) eu (j[áa] )?fiz|hist[óo]rico (de|dos) (pedidos|ordens|compras)|pedidos (anteriores|antigos|que eu (j[áa] )?fiz)|meus or[çc]amentos)\b/i;

// Termos técnicos da gráfica que exigem explicação curta ao leigo (Regra 9).
const TERMOS_TECNICOS: Array<{ termo: RegExp; explicacao: string }> = [
  { termo: /\bDPI\b/i, explicacao: 'resolução da imagem' },
  { termo: /\bsangria\b/i, explicacao: 'margem extra que evita corte indesejado' },
  { termo: /\bgramatura\b/i, explicacao: 'espessura do papel' },
  { termo: /\blamina[çc][ãa]o\b/i, explicacao: 'película protetora aplicada após impressão' },
  { termo: /\bverniz\s+total\b/i, explicacao: 'camada brilhante sobre toda a peça' },
  { termo: /\bCMYK\b/i, explicacao: 'padrão de cores da impressão' },
  { termo: /\bbleed\b/i, explicacao: 'margem extra que evita corte indesejado' },
];

// Heurística: cliente já demonstrou familiaridade técnica? Se sim, não enriquece.
const CLIENTE_FAMILIARIZADO_RE = /\b(DPI|sangria|gramatura|CMYK|bleed|lamina[çc][ãa]o)\b/i;

/**
 * Prepara o contexto a partir do histórico + mensagem atual.
 *
 * Convenção: `deps.conversationHistory` já contém a mensagem atual no fim
 * (anexada por state-router). Este helper NÃO re-anexa para evitar duplicação.
 *
 *  - Extrai entidades direto do histórico montado pelo router (LLM-first, fallback regex)
 *  - Sincroniza no contexto da sessão
 *  - Retorna `{ context, entities }`
 *
 * Fase 3: async porque a extração agora delega ao LLM. Cache no extractor
 * garante que chamadas repetidas no mesmo turno custem zero.
 *
 * Handlers podem optar por não chamar (ex.: boas-vindas, calcular-orcamento)
 * quando entity-extraction não traz valor.
 */
export async function prepareContext(
  _message: string,
  sessao: SessaoRecord,
  deps: HandlerDeps,
): Promise<{ context: ConversationContext; entities: PedidoEntities }> {
  const history = deps.conversationHistory || `Cliente: ${_message}`;

  const entities = await entityExtractionService.extract(history, {
    produtoAtual: sessao.contexto.produto,
  });

  const context = syncContextFromEntities({ ...sessao.contexto }, entities);
  return { context, entities };
}

/**
 * Detecta intent transversal que se aplica a QUALQUER estado.
 *
 * Cobre os sinais que nenhum handler específico deveria precisar reimplementar:
 *  - DUVIDA  → cliente quer esclarecimento (entra em ESCLARECER_DUVIDA)
 *  - ESCALAR → cliente quer humano (entra em ESCALAR_HUMANO)
 *  - NOVO    → cliente quer reiniciar a sessão (Regra 1: estado preservado, sessão nova)
 *
 * Retorna `null` se nenhum desses sinais é claro — handler segue lógica normal.
 */
export function detectCrossCuttingIntent(message: string): CrossCuttingIntent {
  if (!message) return null;
  if (NOVO_RE.test(message)) return 'NOVO';
  if (ESCALAR_RE.test(message)) return 'ESCALAR';
  // PAUSA antes de DUVIDA: "preciso parar" não é uma dúvida, é interrupção.
  if (PAUSE_RE.test(message)) return 'PAUSA';
  // LISTAR_PEDIDOS antes de DUVIDA: "quais pedidos eu fiz" não vai pro RAG.
  if (LISTAR_PEDIDOS_RE.test(message)) return 'LISTAR_PEDIDOS';
  if (DUVIDA.test(message)) return 'DUVIDA';
  return null;
}

/**
 * Aplica Regra 9 — Linguagem acessível ao leigo.
 *
 * Se a resposta contém termos técnicos E o cliente não demonstrou familiaridade
 * (histórico/última mensagem), anexa explicações curtas entre parênteses.
 *
 * Estratégia conservadora: só enriquece o PRIMEIRO termo desconhecido por
 * resposta, evitando poluir a frase. Idempotente: se já há parêntese de
 * explicação ("DPI (resolução...)"), não duplica.
 */
export function enrichForLeigo(resposta: string, contexto?: string): string {
  if (!resposta) return resposta;

  if (contexto && CLIENTE_FAMILIARIZADO_RE.test(contexto)) {
    return resposta;
  }

  for (const { termo, explicacao } of TERMOS_TECNICOS) {
    const match = resposta.match(termo);
    if (!match) continue;

    const idx = match.index ?? -1;
    if (idx < 0) continue;

    const afterTerm = resposta.slice(idx + match[0].length, idx + match[0].length + 60);
    if (/^\s*\(/.test(afterTerm)) continue;

    const before = resposta.slice(0, idx + match[0].length);
    const after = resposta.slice(idx + match[0].length);
    return `${before} (${explicacao})${after}`;
  }

  return resposta;
}

/**
 * Regra 13 — Áudio não é processado.
 *
 * Hoje o parser de webhook (whatsapp.parser.ts) já filtra `type !== 'text'`,
 * então áudios não chegam à FSM. Este helper existe para uso defensivo em
 * caminhos alternativos (REST, testes manuais) e para reforçar contrato:
 * quem chamar deve responder com pedido de texto e NÃO avançar fluxo.
 */
export function isAudioMessage(messageData: unknown): boolean {
  if (!messageData || typeof messageData !== 'object') return false;
  const m = messageData as Record<string, unknown>;
  if (typeof m.type === 'string' && m.type !== 'text') {
    return ['audio', 'voice', 'ptt'].includes(m.type);
  }
  const raw = m.rawPayload as Record<string, unknown> | undefined;
  if (raw && typeof raw.type === 'string') {
    return ['audio', 'voice', 'ptt'].includes(raw.type);
  }
  return false;
}

/**
 * Regra 5 — Desconto só dentro da margem autorizada.
 *
 * Recebe o desconto proposto (em percentual) e a margem máxima (em percentual)
 * e retorna se está dentro do permitido. Acima da margem → handler deve escalar.
 *
 * Aceita também forma "valor absoluto vs base": passe `proposta` como percentual
 * já calculado (ex.: 7 para 7%) ou converta antes de chamar.
 */
export function validateDiscountMargin(
  propostaPercentual: number,
  margemMaxima: number,
): boolean {
  if (!Number.isFinite(propostaPercentual) || !Number.isFinite(margemMaxima)) {
    return false;
  }
  if (propostaPercentual < 0) return false;
  return propostaPercentual <= margemMaxima;
}

/**
 * Margens padrão conforme `data/diretrizes_negociacao.md` (faixa por total do pedido).
 * Util para handlers chamarem `validateDiscountMargin(proposta, getMaxDiscountPercent(total))`.
 */
export function getMaxDiscountPercent(orderTotal: number): number {
  if (!Number.isFinite(orderTotal) || orderTotal <= 0) return 0;
  if (orderTotal < 200) return 0;
  if (orderTotal < 500) return 5;
  return 10;
}

export const baseHandlerUtils = {
  prepareContext,
  detectCrossCuttingIntent,
  enrichForLeigo,
  isAudioMessage,
  validateDiscountMargin,
  getMaxDiscountPercent,
};
