"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncContextFromEntities = syncContextFromEntities;
exports.specsCompletas = specsCompletas;
exports.produtoExigeValidacaoArte = produtoExigeValidacaoArte;
function syncContextFromEntities(context, entities) {
    const updated = { ...context };
    // Produto travado na sessão: só atualiza se ainda não havia produto definido
    if (entities.produtoIdentificado && !context.produto) {
        updated.produto = entities.produtoIdentificado;
    }
    if (entities.requisitos.length > 0) {
        const specs = { ...(updated.specs || {}) };
        for (const req of entities.requisitos) {
            if (req.preenchido && req.resposta) {
                specs[req.pergunta] = req.resposta;
            }
        }
        updated.specs = specs;
        updated.specsPendentes = entities.perguntasFaltantes;
        const arteReq = entities.requisitos.find((r) => r.pergunta.toLowerCase().includes('arte pronta'));
        if (arteReq?.preenchido && arteReq.resposta) {
            const resp = arteReq.resposta.toLowerCase();
            updated.artePronta = resp.includes('sim') && !resp.includes('não') && !resp.includes('nao');
        }
    }
    return updated;
}
function specsCompletas(context) {
    return !context.specsPendentes || context.specsPendentes.length === 0;
}
const PRODUTOS_COM_ARTE = ['panfletos', 'panfleto', 'cartão de visita', 'cartao de visita', 'banner ou lona', 'banner', 'lona', 'blocos', 'bloco'];
function produtoExigeValidacaoArte(context) {
    if (!context.produto)
        return false;
    const prod = context.produto.toLowerCase();
    return PRODUTOS_COM_ARTE.some((p) => prod.includes(p) || p.includes(prod));
}
