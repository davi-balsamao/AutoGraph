export enum ConversationState {
  BOAS_VINDAS = 'BOAS_VINDAS',
  IDENTIFICAR_NECESSIDADE = 'IDENTIFICAR_NECESSIDADE',
  COLETAR_ESPECIFICACOES = 'COLETAR_ESPECIFICACOES',
  VALIDAR_ARQUIVO = 'VALIDAR_ARQUIVO',
  CALCULAR_ORCAMENTO = 'CALCULAR_ORCAMENTO',
  APRESENTAR_ORCAMENTO = 'APRESENTAR_ORCAMENTO',
  AGUARDAR_APROVACAO = 'AGUARDAR_APROVACAO',
  NEGOCIAR = 'NEGOCIAR',
  COLETAR_DADOS_ENTREGA = 'COLETAR_DADOS_ENTREGA',
  CONFIRMAR_PEDIDO = 'CONFIRMAR_PEDIDO',
  GERAR_OS = 'GERAR_OS',
  ESCLARECER_DUVIDA = 'ESCLARECER_DUVIDA',
  PRODUTO_INDISPONIVEL = 'PRODUTO_INDISPONIVEL',
  ESCALAR_HUMANO = 'ESCALAR_HUMANO',
  AGUARDAR_RETORNO = 'AGUARDAR_RETORNO',
  ENCERRAR = 'ENCERRAR',
}

export interface OrcamentoContext {
  total: number;
  prazo: string;
  validade: string;
  detalhes?: string;
}

export interface ConversationContext {
  produto?: string;
  specs?: Record<string, string>;
  specsPendentes?: string[];
  orcamento?: OrcamentoContext;
  orcamentoApresentado?: boolean;
  entrega?: { modalidade: 'retirada' | 'entrega'; endereco?: string };
  osId?: string;
  artePronta?: boolean;
  validacaoArteOk?: boolean;
}

export interface SessaoRecord {
  id: string;
  clienteId: string;
  estadoAtual: string;
  estadoAnterior: string | null;
  contexto: ConversationContext;
  ativa: boolean;
  lembreteEnviado: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

export function parseContext(raw: unknown): ConversationContext {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as ConversationContext;
  }
  return {};
}

export function isConversationState(value: string): value is ConversationState {
  return Object.values(ConversationState).includes(value as ConversationState);
}
