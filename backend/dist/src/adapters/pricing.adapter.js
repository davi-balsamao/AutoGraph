"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingReadAdapter = void 0;
const prisma_1 = require("../config/prisma");
function corrigirMojibake(texto) {
    return texto
        .replace(/Ã¡/g, 'á')
        .replace(/Ã /g, 'à')
        .replace(/Ã¢/g, 'â')
        .replace(/Ã£/g, 'ã')
        .replace(/Ã©/g, 'é')
        .replace(/Ãª/g, 'ê')
        .replace(/Ã­/g, 'í')
        .replace(/Ã³/g, 'ó')
        .replace(/Ã´/g, 'ô')
        .replace(/Ãµ/g, 'õ')
        .replace(/Ãº/g, 'ú')
        .replace(/Ã§/g, 'ç')
        .replace(/�/g, '');
}
function normalizar(texto) {
    return corrigirMojibake(texto)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9,.x ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function aliasesDoProduto(produtoNome) {
    const nome = normalizar(produtoNome);
    if (nome.includes('cartao') ||
        nome.includes('cartoes') ||
        nome.includes('cartao de visita') ||
        nome.includes('cartoes de visita') ||
        (nome.includes('cart') && nome.includes('visita'))) {
        return ['cartao de visita', 'cartoes de visita', 'cartoes', 'cartao'];
    }
    if (nome.includes('panfleto') || nome.includes('flyer')) {
        return ['panfletos 10x14cm', 'panfleto', 'panfletos', 'flyer'];
    }
    if (nome.includes('banner') || nome.includes('lona')) {
        return ['banner em lona', 'banner lona', 'banner', 'lona'];
    }
    if (nome.includes('apostila') || nome.includes('espiral')) {
        return ['apostila espiral', 'apostila', 'espiral'];
    }
    if (nome.includes('bloco')) {
        return ['bloco', 'blocos'];
    }
    return [nome];
}
function textoDasSpecs(specs) {
    if (!specs)
        return '';
    if (typeof specs === 'string')
        return specs;
    try {
        return JSON.stringify(specs);
    }
    catch {
        return String(specs);
    }
}
function extrairDimensoesEmMetros(specs) {
    const textoOriginal = textoDasSpecs(specs);
    const texto = normalizar(textoOriginal);
    const medida = texto.match(/(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)(?:\s*(cm|m|metro|metros))?/i);
    if (!medida)
        return null;
    let largura = Number(medida[1].replace(',', '.'));
    let altura = Number(medida[2].replace(',', '.'));
    const unidade = normalizar(medida[3] || '');
    if (!Number.isFinite(largura) ||
        !Number.isFinite(altura) ||
        largura <= 0 ||
        altura <= 0) {
        return null;
    }
    /**
     * Regra:
     * - Se veio "cm", converte para metro.
     * - Se veio "m"/"metro", mantém.
     * - Se não veio unidade e os números são grandes, assume cm.
     *   Ex.: 100x200 => 100cm x 200cm.
     * - Se não veio unidade e os números são pequenos, assume metro.
     *   Ex.: 1x2 => 1m x 2m.
     */
    const veioEmCentimetros = unidade === 'cm';
    const veioEmMetros = unidade === 'm' || unidade === 'metro' || unidade === 'metros';
    const semUnidadeProvavelmenteCm = !unidade && (largura > 20 || altura > 20);
    if (veioEmCentimetros || (!veioEmMetros && semUnidadeProvavelmenteCm)) {
        largura = largura / 100;
        altura = altura / 100;
    }
    return {
        larguraM: largura,
        alturaM: altura,
    };
}
function calcularPrecoBanner(precoBase, quantidade, specs) {
    const dimensoes = extrairDimensoesEmMetros(specs);
    if (!dimensoes) {
        return precoBase * quantidade;
    }
    const areaM2 = dimensoes.larguraM * dimensoes.alturaM;
    if (!Number.isFinite(areaM2) || areaM2 <= 0) {
        return precoBase * quantidade;
    }
    /**
     * Banner/lona:
     * preçoBase = preço por m²
     * total = área em m² * quantidade * preçoBase
     *
     * Exemplo:
     * 2 banners 100x200cm
     * 100x200cm = 1m x 2m = 2m²
     * 2 unidades = 4m²
     * preçoBase 90 = R$ 360,00
     */
    return precoBase * areaM2 * quantidade;
}
function calcularPrecoBase(produtoNome, precoBase, quantidade, specs) {
    if (!Number.isFinite(precoBase) || precoBase <= 0) {
        throw new Error('Produto encontrado, mas sem preço base válido.');
    }
    if (!Number.isFinite(quantidade) || quantidade <= 0) {
        throw new Error('Quantidade inválida para cálculo de orçamento.');
    }
    const produto = normalizar(produtoNome);
    // Cartões e panfletos: preço base por 100 unidades
    if (produto.includes('cartao') || produto.includes('panfleto')) {
        return precoBase * (quantidade / 100);
    }
    // Blocos: preço base por bloco/unidade
    if (produto.includes('bloco')) {
        return precoBase * quantidade;
    }
    // Banner/lona: preço por m², com conversão correta de cm para m
    if (produto.includes('banner') || produto.includes('lona')) {
        return calcularPrecoBanner(precoBase, quantidade, specs);
    }
    // Apostila: provisório por unidade até termos páginas/custo por página
    if (produto.includes('apostila')) {
        return precoBase * quantidade;
    }
    // Fallback conservador: preço por unidade
    return precoBase * quantidade;
}
class PricingReadAdapter {
    static async calcular(input) {
        const produtoNome = input.produtoNome?.trim();
        if (!produtoNome) {
            throw new Error('Nome do produto não informado.');
        }
        const quantidade = Number(input.quantidade);
        if (!Number.isFinite(quantidade) || quantidade <= 0) {
            throw new Error(`Quantidade inválida: ${input.quantidade}`);
        }
        const produtos = await prisma_1.prisma.produto.findMany();
        const aliases = aliasesDoProduto(produtoNome);
        const produtoDb = produtos.find((produto) => {
            const nomeDb = normalizar(produto.nome);
            return aliases.some((alias) => {
                const aliasNormalizado = normalizar(alias);
                return (nomeDb.includes(aliasNormalizado) ||
                    aliasNormalizado.includes(nomeDb));
            });
        });
        if (!produtoDb) {
            const disponiveis = produtos.map((p) => p.nome).join(', ');
            throw new Error(`Produto não encontrado no catálogo. Produto recebido: "${produtoNome}". Produtos disponíveis: ${disponiveis}`);
        }
        let precoFinal = calcularPrecoBase(produtoDb.nome, produtoDb.precoBase, quantidade, input.specs);
        const textoSpecsNormalizado = normalizar(textoDasSpecs(input.specs));
        const acabamentoNormalizado = normalizar(input.acabamento || '');
        /**
         * Acréscimo simples de acabamento.
         * Observação: para banner/lona, normalmente "ilhós e cordão" pode ter custo próprio,
         * mas mantive a regra existente e só preservei o acréscimo de fosco.
         */
        if (acabamentoNormalizado.includes('fosco') ||
            textoSpecsNormalizado.includes('fosco')) {
            precoFinal += 20.0;
        }
        return Number(precoFinal.toFixed(2));
    }
}
exports.PricingReadAdapter = PricingReadAdapter;
