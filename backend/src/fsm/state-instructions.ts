import * as fs from 'fs';
import * as path from 'path';
import { ConversationState } from './states';

const STATE_FILES: Partial<Record<ConversationState, string>> = {
  [ConversationState.BOAS_VINDAS]: 'boas-vindas.md',
  [ConversationState.IDENTIFICAR_NECESSIDADE]: 'identificar-necessidade.md',
  [ConversationState.COLETAR_ESPECIFICACOES]: 'coletar-espec.md',
  [ConversationState.VALIDAR_ARQUIVO]: 'validar-arquivo.md',
  [ConversationState.CALCULAR_ORCAMENTO]: 'calcular-orcamento.md',
  [ConversationState.APRESENTAR_ORCAMENTO]: 'apresentar-orcamento.md',
  [ConversationState.AGUARDAR_APROVACAO]: 'aguardar-aprovacao.md',
  [ConversationState.NEGOCIAR]: 'negociar.md',
  [ConversationState.COLETAR_DADOS_ENTREGA]: 'dados-entrega.md',
  [ConversationState.CONFIRMAR_PEDIDO]: 'confirmar-pedido.md',
  [ConversationState.GERAR_OS]: 'gerar-os.md',
  [ConversationState.ESCLARECER_DUVIDA]: 'esclarecer-duvida.md',
  [ConversationState.PRODUTO_INDISPONIVEL]: 'produto-indisponivel.md',
  [ConversationState.ESCALAR_HUMANO]: 'escalar-humano.md',
  [ConversationState.AGUARDAR_RETORNO]: 'aguardar-retorno.md',
  [ConversationState.ENCERRAR]: 'encerrar.md',
};

let regrasGeraisCache: string | null = null;

function loadRegrasGerais(): string {
  if (regrasGeraisCache) return regrasGeraisCache;
  const p = path.join(__dirname, '../../rag-test/regras-gerais/regras-gerais.md');
  regrasGeraisCache = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  return regrasGeraisCache;
}

export function getStateInstructions(state: ConversationState): string {
  const fileName = STATE_FILES[state];
  if (!fileName) return '';

  const filePath = path.join(__dirname, '../../rag-test/estados', fileName);
  if (!fs.existsSync(filePath)) return '';

  return fs.readFileSync(filePath, 'utf8');
}

export function getRegrasGerais(): string {
  return loadRegrasGerais();
}
