import { ConversationState } from '../states';
import { StateHandler } from '../handler.types';
import { aguardarAprovacaoHandler } from './aguardar-aprovacao.handler';
import { aguardarRetornoHandler } from './aguardar-retorno.handler';
import { apresentarOrcamentoHandler } from './apresentar-orcamento.handler';
import { boasVindasHandler } from './boas-vindas.handler';
import { calcularOrcamentoHandler } from './calcular-orcamento.handler';
import { coletarDadosEntregaHandler } from './coletar-dados-entrega.handler';
import { coletarEspecificacoesHandler } from './coletar-especificacoes.handler';
import { confirmarPedidoHandler } from './confirmar-pedido.handler';
import { encerrarHandler } from './encerrar.handler';
import { escalarHumanoHandler } from './escalar-humano.handler';
import { esclarecerDuvidaHandler } from './esclarecer-duvida.handler';
import { gerarOsHandler } from './gerar-os.handler';
import { identificarNecessidadeHandler } from './identificar-necessidade.handler';
import { negociarHandler } from './negociar.handler';
import { produtoIndisponivelHandler } from './produto-indisponivel.handler';
import { validarArquivoHandler } from './validar-arquivo.handler';

export function getHandlerForState(state: ConversationState): StateHandler {
  switch (state) {
    case ConversationState.BOAS_VINDAS:
      return boasVindasHandler;
    case ConversationState.IDENTIFICAR_NECESSIDADE:
      return identificarNecessidadeHandler;
    case ConversationState.COLETAR_ESPECIFICACOES:
      return coletarEspecificacoesHandler;
    case ConversationState.VALIDAR_ARQUIVO:
      return validarArquivoHandler;
    case ConversationState.CALCULAR_ORCAMENTO:
      return calcularOrcamentoHandler;
    case ConversationState.APRESENTAR_ORCAMENTO:
      return apresentarOrcamentoHandler;
    case ConversationState.AGUARDAR_APROVACAO:
      return aguardarAprovacaoHandler;
    case ConversationState.NEGOCIAR:
      return negociarHandler;
    case ConversationState.COLETAR_DADOS_ENTREGA:
      return coletarDadosEntregaHandler;
    case ConversationState.CONFIRMAR_PEDIDO:
      return confirmarPedidoHandler;
    case ConversationState.GERAR_OS:
      return gerarOsHandler;
    case ConversationState.ESCLARECER_DUVIDA:
      return esclarecerDuvidaHandler;
    case ConversationState.PRODUTO_INDISPONIVEL:
      return produtoIndisponivelHandler;
    case ConversationState.ESCALAR_HUMANO:
      return escalarHumanoHandler;
    case ConversationState.AGUARDAR_RETORNO:
      return aguardarRetornoHandler;
    case ConversationState.ENCERRAR:
      return encerrarHandler;
    default:
      return identificarNecessidadeHandler;
  }
}
