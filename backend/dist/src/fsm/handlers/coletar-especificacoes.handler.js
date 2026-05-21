"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coletarEspecificacoesHandler = exports.ColetarEspecificacoesHandler = void 0;
const entity_extraction_service_1 = require("../../services/entity-extraction.service");
const catalog_util_1 = require("../catalog.util");
const context_util_1 = require("../context.util");
const states_1 = require("../states");
const transition_service_1 = require("../transition.service");
const base_handler_1 = require("./base.handler");
const TRANSITION_MSG = 'Já anotei tudo! Vou processar seu orçamento e enviar para a nossa equipe aprovar no sistema. Assim que liberado, te passo o valor aqui mesmo, ok?';
const AJUSTE_QUANTIDADE_MINIMA = '__AJUSTE_QUANTIDADE_MINIMA__';
function perguntaTamanhoPersonalizado(message) {
    return /\b(maior|menor|só tem|so tem|apenas essas|outro tamanho|diferente|personalizad|customizad|algo maior|mais grande)\b/i.test(message);
}
function normalizarTexto(valor) {
    return String(valor || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[?:.\s]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function respostaCurta(message) {
    const msg = message.trim();
    if (!msg)
        return false;
    return (/^(\d{1,6})$/.test(msg) ||
        /^(sim|não|nao|colorido|colorida|preto e branco|p\/b|pb|a[3-5])$/i.test(msg) ||
        /^(\d{1,3})\s*x\s*(\d{1,3})(?:\s*(cm|mm|m))?$/i.test(msg) ||
        /^(dois|duas|um|uma|três|tres|quatro|cinco|seis|sete|oito|nove|dez)$/i.test(msg));
}
function palavraNumeroParaDigito(message) {
    const mapa = {
        um: '1',
        uma: '1',
        dois: '2',
        duas: '2',
        tres: '3',
        três: '3',
        quatro: '4',
        cinco: '5',
        seis: '6',
        sete: '7',
        oito: '8',
        nove: '9',
        dez: '10',
    };
    const key = normalizarTexto(message);
    return mapa[key] || message.trim();
}
function formatarRespostaParaPergunta(pergunta, message) {
    const perguntaNorm = normalizarTexto(pergunta);
    const msgOriginal = message.trim();
    const msgNorm = normalizarTexto(msgOriginal);
    const numeroConvertido = palavraNumeroParaDigito(msgOriginal);
    if (perguntaNorm.includes('quantidade')) {
        if (/^\d{1,6}$/.test(numeroConvertido))
            return `${numeroConvertido} unidades`;
        return msgOriginal;
    }
    if (perguntaNorm.includes('vias')) {
        if (/^\d{1,2}$/.test(numeroConvertido))
            return `${numeroConvertido} vias`;
        return msgOriginal;
    }
    if (perguntaNorm.includes('tamanho') || perguntaNorm.includes('formato')) {
        return msgOriginal.toUpperCase();
    }
    if (perguntaNorm.includes('autocopiativo')) {
        if (/^(sim|s)$/i.test(msgNorm))
            return 'Sim, autocopiativo';
        if (/^(nao|não|n)$/i.test(msgNorm))
            return 'Não';
        return msgOriginal;
    }
    if (perguntaNorm.includes('numerado')) {
        if (/^(sim|s)$/i.test(msgNorm))
            return 'Sim, numerado';
        if (/^(nao|não|n)$/i.test(msgNorm))
            return 'Não';
        return msgOriginal;
    }
    if (perguntaNorm.includes('cor') || perguntaNorm.includes('colorido') || perguntaNorm.includes('preto')) {
        if (msgNorm.includes('colorid'))
            return 'Colorido';
        if (msgNorm.includes('preto') || msgNorm === 'pb' || msgNorm === 'p/b')
            return 'Preto e branco';
        return msgOriginal;
    }
    if (perguntaNorm.includes('verniz')) {
        if (/^(sim|s)$/i.test(msgNorm))
            return 'Sim, com verniz total';
        if (/^(nao|não|n)$/i.test(msgNorm))
            return 'Sem verniz total';
        return msgOriginal;
    }
    if (perguntaNorm.includes('lamina')) {
        if (/^(sim|s)$/i.test(msgNorm))
            return 'Com laminação fosca';
        if (/^(nao|não|n)$/i.test(msgNorm))
            return 'Sem laminação';
        return msgOriginal;
    }
    return msgOriginal;
}
function aplicarRespostaCurtaNaPerguntaAtual(context, message, perguntaAtual) {
    if (!perguntaAtual || perguntaAtual === AJUSTE_QUANTIDADE_MINIMA || !respostaCurta(message)) {
        return context;
    }
    const specs = { ...(context.specs || {}) };
    specs[perguntaAtual] = formatarRespostaParaPergunta(perguntaAtual, message);
    const perguntaAtualNorm = normalizarTexto(perguntaAtual);
    const specsPendentes = (context.specsPendentes || []).filter((p) => {
        const pNorm = normalizarTexto(p);
        return pNorm !== perguntaAtualNorm;
    });
    return {
        ...context,
        specs,
        specsPendentes,
    };
}
function extrairQuantidadeDasSpecs(specs) {
    if (!specs)
        return 0;
    const quantidadeEntry = Object.entries(specs).find(([pergunta]) => normalizarTexto(pergunta).includes('quantidade'));
    const fonte = quantidadeEntry ? quantidadeEntry[1] : JSON.stringify(specs);
    const match = String(fonte).match(/\b(\d{1,6})\b/);
    return match ? Number(match[1]) : 0;
}
function quantidadeMinimaProduto(produto) {
    const p = normalizarTexto(produto);
    if (p.includes('panfleto') || p.includes('flyer'))
        return 100;
    if (p.includes('cartao'))
        return 100;
    return 0;
}
function validarQuantidadeMinima(context) {
    const minimo = quantidadeMinimaProduto(context.produto);
    if (!minimo)
        return null;
    const quantidade = extrairQuantidadeDasSpecs(context.specs);
    if (!quantidade || quantidade >= minimo)
        return null;
    return `Para ${context.produto}, a quantidade mínima é de ${minimo} unidades. Posso ajustar seu pedido para ${minimo} unidades?`;
}
function respostaAceitaAjusteMinimo(message) {
    return /\b(sim|pode|pode sim|ok|certo|beleza|perfeito|ajusta|ajustar|fechado|combinado|claro|manda|vamos)\b/i.test(message);
}
function aplicarAjusteQuantidadeMinimaSeAceito(context, message, perguntaAtual) {
    if (!respostaAceitaAjusteMinimo(message))
        return context;
    const minimo = quantidadeMinimaProduto(context.produto);
    if (!minimo)
        return context;
    const quantidadeAtual = extrairQuantidadeDasSpecs(context.specs);
    const deveAjustar = perguntaAtual === AJUSTE_QUANTIDADE_MINIMA ||
        (quantidadeAtual > 0 && quantidadeAtual < minimo);
    if (!deveAjustar)
        return context;
    const specs = { ...(context.specs || {}) };
    const chaveQuantidade = Object.keys(specs).find((k) => normalizarTexto(k).includes('quantidade')) ||
        'Qual quantidade deseja?';
    specs[chaveQuantidade] = `${minimo} unidades`;
    return {
        ...context,
        specs,
        specsPendentes: (context.specsPendentes || []).filter((p) => p !== AJUSTE_QUANTIDADE_MINIMA &&
            !normalizarTexto(p).includes('quantidade')),
    };
}
function aplicarProdutoTravado(context, produtoTravado) {
    if (!produtoTravado)
        return context;
    return {
        ...context,
        produto: produtoTravado,
    };
}
function reforcarQuantidadeDaMensagem(context, message) {
    const msg = palavraNumeroParaDigito(message);
    const match = msg.match(/\b(\d{1,6})\s*(?:unidades?|unid|und|panfletos?|cartões?|cartoes?|blocos?|banners?)?\b/i);
    if (!match)
        return context;
    const quantidade = `${match[1]} unidades`;
    const specs = { ...(context.specs || {}) };
    const chaveQuantidade = Object.keys(specs).find((k) => normalizarTexto(k).includes('quantidade'));
    if (chaveQuantidade) {
        specs[chaveQuantidade] = quantidade;
    }
    else {
        specs['Qual quantidade deseja?'] = quantidade;
    }
    const specsPendentes = (context.specsPendentes || []).filter((p) => !normalizarTexto(p).includes('quantidade'));
    return {
        ...context,
        specs,
        specsPendentes,
    };
}
function removerPendenciasJaPreenchidas(context) {
    const specs = context.specs || {};
    const specsPendentes = (context.specsPendentes || []).filter((pergunta) => {
        if (pergunta === AJUSTE_QUANTIDADE_MINIMA)
            return true;
        const perguntaNorm = normalizarTexto(pergunta);
        const jaPreenchida = Object.entries(specs).some(([chave, resposta]) => {
            if (!resposta || !String(resposta).trim())
                return false;
            const chaveNorm = normalizarTexto(chave);
            return chaveNorm === perguntaNorm || chaveNorm.includes(perguntaNorm) || perguntaNorm.includes(chaveNorm);
        });
        return !jaPreenchida;
    });
    return {
        ...context,
        specsPendentes,
    };
}
function perguntaHumanizada(pergunta) {
    if (pergunta === AJUSTE_QUANTIDADE_MINIMA) {
        return 'Posso ajustar para a quantidade mínima?';
    }
    const p = normalizarTexto(pergunta);
    if (p.includes('quantidade'))
        return 'Perfeito. Quantas unidades você precisa?';
    if (p.includes('tamanho') || p.includes('formato'))
        return 'Certo. Qual tamanho/formato você quer? Pode ser A4, A5 ou uma medida em cm.';
    if (p.includes('vias'))
        return 'Entendi. Cada folha terá quantas vias?';
    if (p.includes('autocopiativo'))
        return 'O papel será autocopiativo?';
    if (p.includes('cor') || p.includes('colorido') || p.includes('preto'))
        return 'A impressão será colorida ou preto e branco?';
    if (p.includes('numerado'))
        return 'O bloco será numerado?';
    if (p.includes('verniz'))
        return 'Terá verniz total?';
    if (p.includes('lamina'))
        return 'Terá laminação?';
    return (0, catalog_util_1.formatarPerguntaCatalogo)(pergunta);
}
function ehPerguntaDeDuvida(message) {
    return /\?|(\b(o que é|o que e|como funciona|pra que serve|para que serve|qual a diferença|qual a diferenca|não entendi|nao entendi|explica|me explica|isso o que é|isso o que e|o que é isso|o que e isso)\b)/i.test(message);
}
function respostaRapidaDuvidaGrafica(message, perguntaAtual) {
    const msg = normalizarTexto(message);
    const pergunta = normalizarTexto(perguntaAtual || '');
    const alvo = `${msg} ${pergunta}`;
    if (alvo.includes('autocopiativo')) {
        return [
            'Papel autocopiativo é aquele usado em blocos/talões com mais de uma via.',
            'Quando você escreve na primeira folha, a informação passa para as vias de baixo, sem precisar de carbono.',
            '',
            'Para o seu bloco, você quer que ele seja autocopiativo?',
        ].join('\n');
    }
    if (alvo.includes('vias')) {
        return [
            'As vias são as cópias de cada folha do bloco.',
            'Por exemplo: 2 vias = uma folha original + uma cópia. 3 vias = original + duas cópias.',
            '',
            'Quantas vias você quer em cada folha?',
        ].join('\n');
    }
    if (alvo.includes('sangria')) {
        return [
            'Sangria é uma margem extra na arte, geralmente de 3mm, que evita bordas brancas depois do corte.',
            'Ela é importante quando a cor ou imagem vai até a borda do material.',
            '',
            'Se tiver o arquivo pronto, pode enviar em PDF, JPG, PNG ou TIFF.',
        ].join('\n');
    }
    if (alvo.includes('laminacao') || alvo.includes('lamina')) {
        return [
            'Laminação é uma película aplicada sobre o impresso para dar mais resistência e acabamento.',
            'A fosca deixa o material mais elegante e sem brilho forte.',
            '',
            'Você quer laminação neste material?',
        ].join('\n');
    }
    if (alvo.includes('verniz')) {
        return [
            'Verniz é um acabamento aplicado sobre o impresso para dar brilho e destacar áreas do material.',
            'Pode ser total, quando cobre tudo, ou localizado, quando destaca apenas partes da arte.',
            '',
            'Você quer verniz neste material?',
        ].join('\n');
    }
    if (alvo.includes('colorid') || alvo.includes('preto') || alvo.includes('p b') || alvo.includes('pb')) {
        return [
            'Colorido é impressão com cores. Preto e branco, ou P/B, usa apenas preto em tons de cinza.',
            '',
            'Para o seu pedido, você prefere colorido ou preto e branco?',
        ].join('\n');
    }
    return null;
}
class ColetarEspecificacoesHandler {
    async handle(message, sessao, deps) {
        const produtoTravado = sessao.contexto.produto || null;
        const perguntaAtualAntes = sessao.contexto.specsPendentes?.[0] || null;
        const produtoNaMensagem = entity_extraction_service_1.entityExtractionService.identificarProdutoNaMensagem(message);
        const offTopicCount = sessao.contexto.offTopicCount || 0;
        if ((0, base_handler_1.isOffTopicMessage)(message) && !produtoTravado && !produtoNaMensagem) {
            return {
                response: 'Conseguimos te ajudar só com produtos gráficos. Me diz qual produto você precisa para eu te passar o orçamento?',
                nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
                updatedContext: { ...sessao.contexto, offTopicCount: offTopicCount + 1 },
            };
        }
        if (offTopicCount >= 2 && produtoNaMensagem && !produtoTravado) {
            return {
                response: 'Combinado! Vou ficar por aqui aguardando. Quando você puder me passar os detalhes do pedido com calma, é só me chamar que retomo daqui.',
                nextState: states_1.ConversationState.AGUARDAR_RETORNO,
                updatedContext: {
                    ...sessao.contexto,
                    produto: produtoNaMensagem.produto,
                    offTopicCount,
                },
            };
        }
        const prepared = await (0, base_handler_1.prepareContext)(message, sessao, deps);
        const entities = prepared.entities;
        let context = (0, context_util_1.syncContextFromEntities)({
            ...sessao.contexto,
            produto: produtoTravado || sessao.contexto.produto,
        }, entities);
        context = aplicarProdutoTravado(context, produtoTravado);
        if (!context.produto && entities.produtoIdentificado) {
            context.produto = entities.produtoIdentificado;
        }
        context = aplicarRespostaCurtaNaPerguntaAtual(context, message, perguntaAtualAntes);
        context = reforcarQuantidadeDaMensagem(context, message);
        context = aplicarAjusteQuantidadeMinimaSeAceito(context, message, perguntaAtualAntes);
        context = removerPendenciasJaPreenchidas(context);
        if (context.produto && entities.perguntasFaltantes.length > 0 && !context.specsPendentes) {
            context.specsPendentes = entities.perguntasFaltantes;
        }
        if (perguntaTamanhoPersonalizado(message)) {
            return {
                response: 'Sim, fazemos tamanhos personalizados! Me passa a largura e a altura em cm que você precisa (ex: 2,00 x 1,00m).',
                nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
                updatedContext: context,
            };
        }
        const nextState = transition_service_1.transitionService.resolve(states_1.ConversationState.COLETAR_ESPECIFICACOES, message, context, entities);
        if (nextState === states_1.ConversationState.ESCLARECER_DUVIDA || ehPerguntaDeDuvida(message)) {
            const respostaLocal = respostaRapidaDuvidaGrafica(message, perguntaAtualAntes);
            if (respostaLocal) {
                return {
                    response: respostaLocal,
                    nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
                    updatedContext: context,
                };
            }
            try {
                const perguntaComContexto = perguntaAtualAntes
                    ? `${message}\n\nContexto: o cliente está respondendo à pergunta "${perguntaAtualAntes}". Explique de forma curta e depois retome a coleta.`
                    : message;
                const ragResult = await deps.ragService.queryWithState(perguntaComContexto, states_1.ConversationState.ESCLARECER_DUVIDA, context, deps.conversationHistory);
                return {
                    response: ragResult.answer,
                    nextState: states_1.ConversationState.ESCLARECER_DUVIDA,
                    updatedContext: context,
                };
            }
            catch (error) {
                console.error('❌ [ColetarEspecificacoes] Falha ao responder dúvida via RAG:', error);
                return {
                    response: 'Posso te explicar sim. Essa é uma informação técnica do pedido. Me diga se você quer seguir com essa opção ou prefere que eu continue com uma alternativa mais simples.',
                    nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
                    updatedContext: context,
                };
            }
        }
        const pendentes = context.specsPendentes ?? entities.perguntasFaltantes;
        if (pendentes.length > 0) {
            return {
                response: perguntaHumanizada(pendentes[0]),
                nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
                updatedContext: context,
            };
        }
        const erroQuantidadeMinima = validarQuantidadeMinima(context);
        if (erroQuantidadeMinima) {
            return {
                response: erroQuantidadeMinima,
                nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
                updatedContext: {
                    ...context,
                    specsPendentes: [
                        AJUSTE_QUANTIDADE_MINIMA,
                        ...(context.specsPendentes || []).filter((p) => p !== AJUSTE_QUANTIDADE_MINIMA),
                    ],
                },
            };
        }
        if (nextState === states_1.ConversationState.VALIDAR_ARQUIVO) {
            return {
                response: 'Perfeito, já tenho as informações. Você já tem a arte pronta em PDF, JPG, PNG ou TIFF?',
                nextState: states_1.ConversationState.VALIDAR_ARQUIVO,
                updatedContext: context,
            };
        }
        if (nextState === states_1.ConversationState.CALCULAR_ORCAMENTO) {
            return {
                response: TRANSITION_MSG,
                nextState: states_1.ConversationState.CALCULAR_ORCAMENTO,
                updatedContext: context,
                chainNext: states_1.ConversationState.CALCULAR_ORCAMENTO,
            };
        }
        const ragResult = await deps.ragService.queryWithState(message, states_1.ConversationState.COLETAR_ESPECIFICACOES, context, deps.conversationHistory);
        return {
            response: ragResult.answer,
            nextState: states_1.ConversationState.COLETAR_ESPECIFICACOES,
            updatedContext: context,
        };
    }
}
exports.ColetarEspecificacoesHandler = ColetarEspecificacoesHandler;
exports.coletarEspecificacoesHandler = new ColetarEspecificacoesHandler();
