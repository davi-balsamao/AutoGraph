import { PedidoEntities } from '../services/entity-extraction.service';
import { ConversationContext, ConversationState } from './states';
import { produtoExigeValidacaoArte, specsCompletas } from './context.util';

const SAUDACOES = /^(oi|olá|ola|bom dia|boa tarde|boa noite|tudo bem|e aí|eai)\b/i;
const APROVACAO = /\b(aceito|aprovo|aprovado|pode ser|fechado|confirmo|sim|ok|beleza|combinado|vamos)\b/i;
const RECUSA = /\b(não quero|nao quero|desisto|cancela|cancelar|não vou|nao vou|recuso|vou pensar|vou passar|por enquanto não|por enquanto nao|não vou fechar|nao vou fechar|só comparar|so comparar|talvez retorne|não por agora|nao por agora)\b/i;
const NEGOCIACAO = /\b(caro|caro demais|desconto|mais barato|abaixa|concorrente|negociar)\b/i;
// Fase 5: ampliado para incluir perguntas de preço/orçamento. Cliente que pergunta
// "quanto custa" antes de fornecer specs é tratado como dúvida — o bot redireciona
// via ESCLARECER_DUVIDA explicando que precisa de mais info antes de calcular
// (alinhado com Regras 3 e 10 das regras-gerais.md).
// Nota: "orçamento" sozinho NÃO é dúvida (ex.: "pode calcular o orçamento" é
// instrução redundante, não pergunta). Só captura quando vier com semântica de
// pergunta ("qual o orçamento", "sobre o orçamento", "dúvida sobre o orçamento").
// Regex amplo de dúvida: cobre perguntas sobre processo, preço, catálogo
// aberto e pedidos de recomendação. Reflete intenções que devem desviar para
// ESCLARECER_DUVIDA (RAG + base de conhecimento) em vez de tentar processar
// como resposta do estado atual.
export const DUVIDA =
  /\b(d[úu]vida|como funciona|o que [eé]|qual a diferen[çc]a|qual.{0,20}diferen[çc]a|diferen[çc]a (entre|t[ée]cnica)|explica|n[ãa]o entendi|n[ãa]o sei se|pre[çc]o|quanto custa|quanto fica|qual o valor|qual valor|qual o or[çc]amento|preciso saber o pre[çc]o|preciso saber|qual o custo|qual custo|quais produtos?|que produtos?|voc[êe]s fazem|voc[êe]s t[êe]m|voc[êe]s trabalham|trabalham com|fazem o qu[êe]|que tipo de|tipos de|recomenda|sugere|sugest[ãa]o|me indica|me ajuda a escolher|qual o melhor|qual a melhor|qual o ideal|qual ideal|o que voc[êe] acha|o que voc[êe]s acham|vale mais a pena)\b/i;
const RECLAMACAO = /\b(reclamação|reclamacao|problema grave|processo|advogado|péssimo|pessimo|saiu errado|saiu completamente errado|errad[oa]s?|inaceit[aá]vel|inaceitaveis|diferente do que pedi|n[aã]o era isso|ficou errado|ficou diferente|incorret[oa]s?|insatisfeit[oa]|produto errado|qualidade p[eé]ssima)\b/i;
const ARTE_OK = /\b(enviei|mandei|anexei|segue a arte|arquivo ok|está certo|esta certo|pode usar)\b/i;
const ENTREGA = /\b(entrega|entregar|retirada|retirar|buscar|endereço|endereco|rua|avenida|av\.|cep)\b/i;
const CONFIRMACAO_PEDIDO = /\b(confirmo|confirmado|está certo|esta certo|pode gerar|pode fazer)\b/i;
const HUMANO = /\b(atendente|humano|gerente|pessoa|falar com alguém|falar com alguem)\b/i;

export class TransitionService {
  resolve(
    current: ConversationState,
    message: string,
    context: ConversationContext,
    entities: PedidoEntities
  ): ConversationState {
    const msg = message.toLowerCase().trim();

    if (HUMANO.test(msg)) {
      return ConversationState.ESCALAR_HUMANO;
    }

    switch (current) {
      case ConversationState.BOAS_VINDAS:
        if (RECLAMACAO.test(msg)) return ConversationState.ESCALAR_HUMANO;
        return ConversationState.IDENTIFICAR_NECESSIDADE;

      case ConversationState.IDENTIFICAR_NECESSIDADE:
        if (RECLAMACAO.test(msg)) return ConversationState.ESCALAR_HUMANO;
        if (DUVIDA.test(msg) && !entities.produtoIdentificado) {
          return ConversationState.ESCLARECER_DUVIDA;
        }
        if (entities.produtoDesconhecido) {
          return ConversationState.PRODUTO_INDISPONIVEL;
        }
        if (entities.produtoIdentificado) {
          return ConversationState.COLETAR_ESPECIFICACOES;
        }
        return current;

      case ConversationState.COLETAR_ESPECIFICACOES:
        if (DUVIDA.test(msg)) return ConversationState.ESCLARECER_DUVIDA;
        // Sem produto no contexto, fica coletando — nunca avança para
        // CALCULAR_ORCAMENTO sem ter o que orçar. Protege contra chains que
        // entram aqui com contexto vazio (ex: vindo de ESCLARECER_DUVIDA).
        if (!context.produto) return current;
        if (!specsCompletas(context)) return current;
        if (produtoExigeValidacaoArte(context)) {
          return ConversationState.VALIDAR_ARQUIVO;
        }
        return ConversationState.CALCULAR_ORCAMENTO;

      case ConversationState.VALIDAR_ARQUIVO:
        if (ARTE_OK.test(msg) || /\bsim\b/.test(msg)) {
          return ConversationState.CALCULAR_ORCAMENTO;
        }
        return current;

      case ConversationState.CALCULAR_ORCAMENTO:
        // Quando aprovação admin é exigida, o chain do handler manda para
        // AGUARDAR_APROVACAO_ADMIN; caso contrário segue direto para
        // APRESENTAR_ORCAMENTO. A FSM aqui só cobre a transição síncrona —
        // o handler decide o nextState efetivo.
        return ConversationState.APRESENTAR_ORCAMENTO;

      case ConversationState.AGUARDAR_APROVACAO_ADMIN:
        // Preso até admin agir via API. Mensagens do cliente são tratadas
        // pelo handler (envia "estou revisando" 1x e depois silencia).
        return current;

      case ConversationState.APRESENTAR_ORCAMENTO:
        return ConversationState.AGUARDAR_APROVACAO;

      case ConversationState.AGUARDAR_APROVACAO:
        if (RECUSA.test(msg)) return ConversationState.ENCERRAR;
        if (APROVACAO.test(msg)) return ConversationState.COLETAR_DADOS_ENTREGA;
        if (NEGOCIACAO.test(msg)) return ConversationState.NEGOCIAR;
        if (DUVIDA.test(msg)) {
          if (context.orcamento && (msg.includes('calcular') || msg.includes('calcula') || msg.includes('faz o') || msg.includes('pode fazer') || msg.includes('gera o'))) {
            return current;
          }
          return ConversationState.ESCLARECER_DUVIDA;
        }
        return current;

      case ConversationState.NEGOCIAR:
        if (RECUSA.test(msg)) return ConversationState.ENCERRAR;
        if (APROVACAO.test(msg)) return ConversationState.COLETAR_DADOS_ENTREGA;
        return current;

      case ConversationState.COLETAR_DADOS_ENTREGA:
        if (ENTREGA.test(msg) || context.entrega?.modalidade) {
          return ConversationState.CONFIRMAR_PEDIDO;
        }
        return current;

      case ConversationState.CONFIRMAR_PEDIDO:
        if (CONFIRMACAO_PEDIDO.test(msg) || APROVACAO.test(msg)) {
          return ConversationState.GERAR_OS;
        }
        return current;

      case ConversationState.GERAR_OS:
        return ConversationState.ENCERRAR;

      case ConversationState.ESCLARECER_DUVIDA:
        if (APROVACAO.test(msg) || /\b(obrigad|entendi|ok)\b/.test(msg)) {
          return ConversationState.IDENTIFICAR_NECESSIDADE;
        }
        return current;

      case ConversationState.PRODUTO_INDISPONIVEL:
        if (entities.produtoIdentificado) {
          return ConversationState.COLETAR_ESPECIFICACOES;
        }
        return current;

      case ConversationState.ESCALAR_HUMANO:
        return current;

      case ConversationState.AGUARDAR_RETORNO:
        if (msg.length > 0 && !SAUDACOES.test(msg)) {
          return ConversationState.IDENTIFICAR_NECESSIDADE;
        }
        return current;

      case ConversationState.ENCERRAR:
        return current;

      default:
        return current;
    }
  }

  shouldPushPreviousState(
    from: ConversationState,
    to: ConversationState
  ): boolean {
    return (
      to === ConversationState.ESCLARECER_DUVIDA &&
      from !== ConversationState.ESCLARECER_DUVIDA
    );
  }

  restorePreviousState(estadoAnterior: string | null): ConversationState {
    if (estadoAnterior && Object.values(ConversationState).includes(estadoAnterior as ConversationState)) {
      return estadoAnterior as ConversationState;
    }
    return ConversationState.IDENTIFICAR_NECESSIDADE;
  }
}

export const transitionService = new TransitionService();
