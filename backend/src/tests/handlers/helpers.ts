/**
 * Fixtures e factories para testes de handlers.
 *
 * Cada handler deve mockar `../../services/entity-extraction.service` no topo
 * via `jest.mock(...)`, e depois usar essas factories para construir entradas.
 */

import type { PedidoEntities } from '../../services/entity-extraction.service';
import type { HandlerDeps } from '../../fsm/handler.types';
import type { ConversationContext, SessaoRecord } from '../../fsm/states';
import type { RagQueryResult, RagService } from '../../services/rag.service';

export function makeEntities(overrides: Partial<PedidoEntities> = {}): PedidoEntities {
  return {
    produtoIdentificado: null,
    produtoDesconhecido: false,
    requisitos: [],
    completo: false,
    perguntasFaltantes: [],
    ...overrides,
  };
}

export function makeSessao(overrides: Partial<SessaoRecord> = {}): SessaoRecord {
  return {
    id: 'sess-123',
    clienteId: 'cli-456',
    estadoAtual: 'IDENTIFICAR_NECESSIDADE',
    estadoAnterior: null,
    contexto: {} as ConversationContext,
    ativa: true,
    lembreteEnviado: false,
    criadoEm: new Date('2026-05-16T10:00:00Z'),
    atualizadoEm: new Date('2026-05-16T10:00:00Z'),
    ...overrides,
  };
}

export function makeRagMock(answer = 'mocked RAG answer'): RagService {
  const ragResult: RagQueryResult = { answer, sourceDocuments: [] };
  return {
    queryWithState: jest.fn(async () => ragResult),
    query: jest.fn(async () => ragResult),
    generateSuggestedMessage: jest.fn(async () => 'sugestão mock'),
  } as unknown as RagService;
}

export function makeDeps(overrides: Partial<HandlerDeps> = {}): HandlerDeps {
  return {
    ragService: makeRagMock(),
    conversationHistory: '',
    clienteNome: 'Cliente Teste',
    clienteTelefone: '5531999990000',
    ...overrides,
  };
}
