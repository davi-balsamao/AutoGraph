"use strict";
/**
 * Fixtures e factories para testes de handlers.
 *
 * Cada handler deve mockar `../../services/entity-extraction.service` no topo
 * via `jest.mock(...)`, e depois usar essas factories para construir entradas.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeEntities = makeEntities;
exports.makeSessao = makeSessao;
exports.makeRagMock = makeRagMock;
exports.makeDeps = makeDeps;
function makeEntities(overrides = {}) {
    return {
        produtoIdentificado: null,
        produtoDesconhecido: false,
        requisitos: [],
        completo: false,
        perguntasFaltantes: [],
        ...overrides,
    };
}
function makeSessao(overrides = {}) {
    return {
        id: 'sess-123',
        clienteId: 'cli-456',
        estadoAtual: 'IDENTIFICAR_NECESSIDADE',
        estadoAnterior: null,
        contexto: {},
        ativa: true,
        lembreteEnviado: false,
        criadoEm: new Date('2026-05-16T10:00:00Z'),
        atualizadoEm: new Date('2026-05-16T10:00:00Z'),
        ...overrides,
    };
}
function makeRagMock(answer = 'mocked RAG answer') {
    const ragResult = { answer, sourceDocuments: [] };
    return {
        queryWithState: jest.fn(async () => ragResult),
        query: jest.fn(async () => ragResult),
        generateSuggestedMessage: jest.fn(async () => 'sugestão mock'),
    };
}
function makeDeps(overrides = {}) {
    return {
        ragService: makeRagMock(),
        conversationHistory: '',
        clienteNome: 'Cliente Teste',
        clienteTelefone: '5531999990000',
        ...overrides,
    };
}
