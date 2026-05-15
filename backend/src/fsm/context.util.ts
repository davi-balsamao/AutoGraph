import { PedidoEntities } from '../services/entity-extraction.service';
import { ConversationContext } from './states';

export function syncContextFromEntities(
  context: ConversationContext,
  entities: PedidoEntities
): ConversationContext {
  const updated: ConversationContext = { ...context };

  // Produto travado na sessão: só atualiza se ainda não havia produto definido
  if (entities.produtoIdentificado && !context.produto) {
    updated.produto = entities.produtoIdentificado;
  }

  if (entities.requisitos.length > 0) {
    const specs: Record<string, string> = { ...(updated.specs || {}) };
    for (const req of entities.requisitos) {
      if (req.preenchido && req.resposta) {
        specs[req.pergunta] = req.resposta;
      }
    }
    updated.specs = specs;
    updated.specsPendentes = entities.perguntasFaltantes;

    const arteReq = entities.requisitos.find((r) =>
      r.pergunta.toLowerCase().includes('arte pronta')
    );
    if (arteReq?.preenchido && arteReq.resposta) {
      const resp = arteReq.resposta.toLowerCase();
      updated.artePronta = resp.includes('sim') && !resp.includes('não') && !resp.includes('nao');
    }
  }

  return updated;
}

export function specsCompletas(context: ConversationContext): boolean {
  return !context.specsPendentes || context.specsPendentes.length === 0;
}

export function produtoExigeValidacaoArte(context: ConversationContext): boolean {
  return context.artePronta === true;
}
