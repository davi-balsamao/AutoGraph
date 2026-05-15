import { ConversationState } from '../states';
import { StateHandler } from '../handler.types';
import { createGenericHandler } from './generic.handler';
import { coletarEspecificacoesHandler } from './coletar-especificacoes.handler';
import { identificarNecessidadeHandler } from './identificar-necessidade.handler';
import { boasVindasHandler } from './boas-vindas.handler';
import { calcularOrcamentoHandler } from './calcular-orcamento.handler';
import { apresentarOrcamentoHandler } from './apresentar-orcamento.handler';
import { gerarOsHandler } from './gerar-os.handler';

const GENERIC_STATES: ConversationState[] = [
  ConversationState.VALIDAR_ARQUIVO,
  ConversationState.AGUARDAR_APROVACAO,
  ConversationState.NEGOCIAR,
  ConversationState.COLETAR_DADOS_ENTREGA,
  ConversationState.CONFIRMAR_PEDIDO,
  ConversationState.ESCLARECER_DUVIDA,
  ConversationState.PRODUTO_INDISPONIVEL,
  ConversationState.ESCALAR_HUMANO,
  ConversationState.AGUARDAR_RETORNO,
  ConversationState.ENCERRAR,
];

export function getHandlerForState(state: ConversationState): StateHandler {
  switch (state) {
    case ConversationState.BOAS_VINDAS:
      return boasVindasHandler;
    case ConversationState.IDENTIFICAR_NECESSIDADE:
      return identificarNecessidadeHandler;
    case ConversationState.COLETAR_ESPECIFICACOES:
      return coletarEspecificacoesHandler;
    case ConversationState.CALCULAR_ORCAMENTO:
      return calcularOrcamentoHandler;
    case ConversationState.APRESENTAR_ORCAMENTO:
      return apresentarOrcamentoHandler;
    case ConversationState.GERAR_OS:
      return gerarOsHandler;
    default:
      if (GENERIC_STATES.includes(state)) {
        return createGenericHandler(state);
      }
      return createGenericHandler(ConversationState.IDENTIFICAR_NECESSIDADE);
  }
}
