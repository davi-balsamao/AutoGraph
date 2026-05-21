import { entityExtractionService } from '../../services/entity-extraction.service';
import { formatarPerguntaCatalogo } from '../catalog.util';
import { syncContextFromEntities } from '../context.util';
import { HandlerDeps, HandlerResult, StateHandler } from '../handler.types';
import { ConversationState, parseContext, SessaoRecord } from '../states';
import { DUVIDA, transitionService } from '../transition.service';
import { prepareContext } from './base.handler';

const SAIDA_DUVIDA = /\b(entendi|obrigad|beleza|ok|vou de|vou com|fico com|prefiro)\b/i;

// Produtos claramente fora do catálogo da gráfica.
// Isso evita que o RAG/LLM tente transformar "copos personalizados" em pedido gráfico genérico.
const PRODUTOS_FORA_CATALOGO =
  /\b(copo|copos|caneca|canecas|camiseta|camisetas|bon[eé]s|bone|garrafa|garrafas|squeeze|brinde|brindes|chaveiro|chaveiros|sacola|sacolas|agenda personalizada|mousepad|mouse pad)\b/i;

// Detectores de idioma — exigem pelo menos 2 marcadores fortes para evitar
// falso-positivo em frases curtas em PT que compartilham cognatos.
const MARCADORES_ESPANHOL = [
  /¡/,
  /¿/,
  /\bhola\b/i,
  /\bgracias\b/i,
  /\bquiero\b/i,
  /\bnecesito\b/i,
  /\bprefiero\b/i,
  /\bhablar\b/i,
  /\bhablo\b/i,
  /\bespañol\b/i,
  /\bespanol\b/i,
  /\bes posible\b/i,
  /\bpor favor\b/i,
  /\bmi negocio\b/i,
  /\bimpresi[óo]n\b/i,
  /\bfolletos?\b/i,
  /\btarjetas?\b/i,
  /\bpancartas?\b/i,
  /\bapuntes?\b/i,
  /\btalonarios?\b/i,
];

const MARCADORES_INGLES = [
  /\bhello\b/i,
  /\bhi\b/i,
  /\bhey\b/i,
  /\bi want\b/i,
  /\bi need\b/i,
  /\bi'?d like\b/i,
  /\bi would like\b/i,
  /\bi prefer\b/i,
  /\bcan you\b/i,
  /\bcould you\b/i,
  /\bdo you\b/i,
  /\bare you\b/i,
  /\bplease\b/i,
  /\bthanks?\b/i,
  /\bthank you\b/i,
  /\benglish\b/i,
  /\bspeak\b/i,
  /\bfor my\b/i,
  /\bmy business\b/i,
  /\bbusiness cards?\b/i,
  /\bleaflets?\b/i,
  /\bbooklets?\b/i,
  /\bbrochures?\b/i,
  /\bprinting\b/i,
  /\bprints?\b/i,
  /\bcopies\b/i,
];

type IdiomaDetectado = 'es' | 'en' | null;

function detectarIdioma(message: string): IdiomaDetectado {
  if (!message) return null;

  let esHits = 0;
  for (const re of MARCADORES_ESPANHOL) {
    if (re.test(message)) esHits++;
    if (esHits >= 2) return 'es';
  }

  let enHits = 0;
  for (const re of MARCADORES_INGLES) {
    if (re.test(message)) enHits++;
    if (enHits >= 2) return 'en';
  }

  return null;
}

function prefixoBilingue(idioma: 'es' | 'en'): string {
  if (idioma === 'en') {
    return (
      'Hello! Got your request. / Olá! Entendi o seu pedido.\n' +
      'Our service runs in Portuguese — you can keep writing in English and I will reply in PT, ok?\n'
    );
  }

  return (
    '¡Hola! Entendí tu pedido. / Olá! Entendi o seu pedido.\n' +
    'Nosso atendimento é em português — pode continuar escrevendo em espanhol que eu respondo em PT, ok?\n'
  );
}

export class IdentificarNecessidadeHandler implements StateHandler {
  async handle(
    message: string,
    sessao: SessaoRecord,
    deps: HandlerDeps
  ): Promise<HandlerResult> {
    const contextInicial = parseContext(sessao.contexto);

    // Trava determinística para produto fora do catálogo.
    // Precisa vir antes de DUVIDA/RAG/LLM.
    if (PRODUTOS_FORA_CATALOGO.test(message)) {
      return {
        response:
          'No momento não trabalhamos com esse produto. Podemos te ajudar com materiais impressos como panfletos, cartões de visita, banners, blocos ou apostilas.',
        nextState: ConversationState.PRODUTO_INDISPONIVEL,
        updatedContext: {
          ...contextInicial,
          specs: {
            ...(contextInicial.specs || {}),
            produtoIndisponivelSolicitado: message,
          },
        },
        chainNext: ConversationState.PRODUTO_INDISPONIVEL,
      };
    }

    if (DUVIDA.test(message) && !SAIDA_DUVIDA.test(message)) {
      // Resposta vem do RAG com o prompt do estado ESCLARECER_DUVIDA.
      const ragResult = await deps.ragService.queryWithState(
        message,
        ConversationState.ESCLARECER_DUVIDA,
        contextInicial,
        deps.conversationHistory
      );

      return {
        response: ragResult.answer,
        nextState: ConversationState.ESCLARECER_DUVIDA,
        updatedContext: contextInicial,
      };
    }

    const idioma = detectarIdioma(message);
    const produtoNaMensagem = entityExtractionService.identificarProdutoNaMensagem(message);

    if (produtoNaMensagem) {
      const entities = await entityExtractionService.extract(deps.conversationHistory, {
        produtoAtual: produtoNaMensagem.produto,
      });

      const context = syncContextFromEntities(
        { produto: produtoNaMensagem.produto },
        entities
      );

      const pendentes = entities.perguntasFaltantes;
      const baseResp = pendentes.length
        ? formatarPerguntaCatalogo(pendentes[0])
        : `Perfeito, vamos com ${produtoNaMensagem.produto}! Me conta o que você precisa.`;

      const response = idioma ? `${prefixoBilingue(idioma)}${baseResp}` : baseResp;

      return {
        response,
        nextState: ConversationState.COLETAR_ESPECIFICACOES,
        updatedContext: context,
      };
    }

    const prepared = await prepareContext(message, sessao, deps);
    const entities = prepared.entities;
    let context = prepared.context;

    let nextState = transitionService.resolve(
      ConversationState.IDENTIFICAR_NECESSIDADE,
      message,
      context,
      entities
    );

    if (entities.produtoIdentificado) {
      nextState = ConversationState.COLETAR_ESPECIFICACOES;
      context = syncContextFromEntities(
        { produto: entities.produtoIdentificado },
        entities
      );

      const pendentes = entities.perguntasFaltantes;

      if (pendentes.length) {
        const baseResp = formatarPerguntaCatalogo(pendentes[0]);

        return {
          response: idioma ? `${prefixoBilingue(idioma)}${baseResp}` : baseResp,
          nextState,
          updatedContext: context,
        };
      }
    }

    if (nextState === ConversationState.PRODUTO_INDISPONIVEL) {
      return {
        response: '',
        nextState,
        updatedContext: context,
        chainNext: ConversationState.PRODUTO_INDISPONIVEL,
      };
    }

    const ragResult = await deps.ragService.queryWithState(
      message,
      ConversationState.IDENTIFICAR_NECESSIDADE,
      context,
      deps.conversationHistory
    );

    return {
      response: idioma ? `${prefixoBilingue(idioma)}${ragResult.answer}` : ragResult.answer,
      nextState,
      updatedContext: context,
    };
  }
}

export const identificarNecessidadeHandler = new IdentificarNecessidadeHandler();