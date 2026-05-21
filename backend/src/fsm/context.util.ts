import { PedidoEntities } from '../services/entity-extraction.service';
import { ConversationContext } from './states';

function normalizarTexto(valor: unknown): string {
  return String(valor || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?:.\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRespostaValida(valor: unknown): valor is string {
  if (valor === null || valor === undefined) return false;

  const texto = String(valor).trim();

  if (!texto) return false;

  const textoNorm = normalizarTexto(texto);

  return !['null', 'undefined', 'nao informado', 'não informado'].includes(textoNorm);
}

function montarPendentesPreservandoContexto(
  perguntasFaltantes: string[],
  specs: Record<string, string>
): string[] {
  return perguntasFaltantes.filter((pergunta) => {
    const perguntaNorm = normalizarTexto(pergunta);

    const jaExiste = Object.entries(specs).some(([chave, valor]) => {
      if (!isRespostaValida(valor)) return false;

      const chaveNorm = normalizarTexto(chave);

      return chaveNorm === perguntaNorm || chaveNorm.includes(perguntaNorm) || perguntaNorm.includes(chaveNorm);
    });

    return !jaExiste;
  });
}

export function syncContextFromEntities(
  context: ConversationContext,
  entities: PedidoEntities
): ConversationContext {
  const updated: ConversationContext = { ...context };

  // Produto travado na sessão: só atualiza se ainda não havia produto definido.
  if (entities.produtoIdentificado && !context.produto) {
    updated.produto = entities.produtoIdentificado;
  }

  const specs: Record<string, string> = { ...(updated.specs || {}) };

  if (entities.requisitos.length > 0) {
    for (const req of entities.requisitos) {
      if (req.preenchido && isRespostaValida(req.resposta)) {
        specs[req.pergunta] = req.resposta;
      }
    }

    updated.specs = specs;

    /**
     * Importante:
     * Não usamos cegamente entities.perguntasFaltantes.
     * Quando o LLM cai em fallback ou perde parte do histórico, ele pode dizer que
     * falta algo que já estava em context.specs. Aqui limpamos essas falsas pendências.
     */
    updated.specsPendentes = montarPendentesPreservandoContexto(
      entities.perguntasFaltantes,
      specs
    );

    const arteReq = entities.requisitos.find((r) =>
      normalizarTexto(r.pergunta).includes('arte pronta')
    );

    if (arteReq?.preenchido && isRespostaValida(arteReq.resposta)) {
      const resp = normalizarTexto(arteReq.resposta);
      updated.artePronta = resp.includes('sim') && !resp.includes('nao');
    }
  } else {
    /**
     * Se a extração falhou feio e voltou sem requisitos, preserva tudo.
     * Não limpa specs nem specsPendentes aqui.
     */
    updated.specs = specs;
  }

  return updated;
}

export function specsCompletas(context: ConversationContext): boolean {
  return !context.specsPendentes || context.specsPendentes.length === 0;
}

const PRODUTOS_COM_ARTE = [
  'panfletos',
  'panfleto',
  'cartão de visita',
  'cartao de visita',
  'banner ou lona',
  'banner',
  'lona',
  'blocos',
  'bloco',
];

export function produtoExigeValidacaoArte(context: ConversationContext): boolean {
  if (!context.produto) return false;

  const prod = context.produto.toLowerCase();

  return PRODUTOS_COM_ARTE.some((p) => prod.includes(p) || p.includes(prod));
}