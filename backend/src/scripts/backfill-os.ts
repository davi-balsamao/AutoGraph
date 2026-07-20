import 'dotenv/config';
import { PrismaClient, ModalidadeEntrega, TipoArquivo } from '@prisma/client';

/**
 * Backfill (Fase 1) — popula as colunas/tabelas normalizadas a partir do
 * `OrdensDeServico.especificacoes` JSON histórico, sem apagar o JSON.
 *
 * É IDEMPOTENTE: só processa OS que ainda não têm nenhum ItemOS. Rodar 2x não
 * duplica nada.
 *
 * Trata os formatos conhecidos de `especificacoes`:
 *  - nested (fluxo real):  { produto, requisitos:[{pergunta,resposta}], orcamento:{total}, entrega:{modalidade,endereco} }
 *  - flat (seed-os):       { produto, quantidade, papel }
 *  - seed.ts:              { descricao, total }
 *  - chaves do frontend:   { produtoNome, specs, opcaoEntrega, enderecoEntrega, referenciaEntrega, arteUrl/arte_url/arte/url, precoBaseReferencia/precoBase }
 */

const prisma = new PrismaClient();

type Esp = Record<string, any>;

/** Extrai o primeiro número (inteiro) de uma string livre, ex.: "1000 unidades" -> 1000. */
function parseIntFrom(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string') {
    const m = value.replace(/\./g, '').match(/\d+/);
    if (m) return parseInt(m[0], 10);
  }
  return null;
}

/** Extrai um valor monetário (float) de number|string ("R$ 275,00" -> 275.0). */
function parseMoneyFrom(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function getRequisitos(esp: Esp): Array<{ pergunta: string; resposta: string }> {
  if (Array.isArray(esp.requisitos)) return esp.requisitos;
  return [];
}

function getProdutoNome(esp: Esp): string {
  return (esp.produtoNome ?? esp.produto ?? esp.descricao ?? 'Produto personalizado').toString();
}

function getQuantidade(esp: Esp): number {
  const direct = parseIntFrom(esp.quantidade) ?? parseIntFrom(esp.specs?.quantidade);
  if (direct && direct > 0) return direct;
  const req = getRequisitos(esp).find((r) => r.pergunta?.toLowerCase().includes('quantidade'));
  const fromReq = parseIntFrom(req?.resposta);
  if (fromReq && fromReq > 0) return fromReq;
  return 1;
}

/** Total do pedido: orcamento.total > total > precoBaseReferencia/precoBase. */
function getTotal(esp: Esp): number {
  return (
    parseMoneyFrom(esp.orcamento?.total) ??
    parseMoneyFrom(esp.total) ??
    parseMoneyFrom(esp.precoBaseReferencia) ??
    parseMoneyFrom(esp.precoBase) ??
    0
  );
}

function getPrecoUnitario(esp: Esp, total: number, quantidade: number): number {
  const ref = parseMoneyFrom(esp.precoBaseReferencia) ?? parseMoneyFrom(esp.precoBase);
  if (ref && ref > 0) return ref;
  if (quantidade > 0 && total > 0) return Number((total / quantidade).toFixed(2));
  return total;
}

function getModalidade(esp: Esp): ModalidadeEntrega {
  const m = (esp.entrega?.modalidade ?? esp.opcaoEntrega ?? '').toString().toLowerCase();
  return m === 'entrega' ? ModalidadeEntrega.ENTREGA : ModalidadeEntrega.RETIRADA;
}

function getEnderecoEntrega(esp: Esp): { texto: string; referencia?: string } | null {
  const texto = esp.entrega?.endereco ?? esp.enderecoEntrega;
  if (texto && typeof texto === 'string' && texto.trim()) {
    return { texto: texto.trim(), referencia: esp.referenciaEntrega?.toString()?.trim() || undefined };
  }
  return null;
}

function getArteUrl(esp: Esp): string | null {
  for (const key of ['arteUrl', 'arte_url', 'arte', 'url']) {
    const v = esp[key];
    if (typeof v === 'string' && (v.startsWith('http') || v.startsWith('/uploads'))) return v;
  }
  return null;
}

/** Guarda os detalhes de spec do item (material/acabamento/medidas) sem duplicar campos já promovidos. */
function buildItemEspecificacoes(esp: Esp): Esp {
  const out: Esp = {};
  if (esp.specs) out.specs = esp.specs;
  if (esp.requisitos) out.requisitos = esp.requisitos;
  if (esp.papel) out.papel = esp.papel;
  if (esp.material) out.material = esp.material;
  if (esp.descricao) out.descricao = esp.descricao;
  return out;
}

async function main() {
  // Idempotência: só OS sem nenhum ItemOS.
  const ordens = await prisma.ordensDeServico.findMany({ where: { itens: { none: {} } } });
  console.log(`🔎 ${ordens.length} OS sem itens para backfillar.`);

  let ok = 0;
  for (const os of ordens) {
    const esp = (os.especificacoes ?? {}) as unknown as Esp;

    const produtoNome = getProdutoNome(esp);
    const quantidade = getQuantidade(esp);
    const total = getTotal(esp);
    const precoUnitario = getPrecoUnitario(esp, total, quantidade);
    const modalidade = getModalidade(esp);
    const endereco = getEnderecoEntrega(esp);
    const arteUrl = getArteUrl(esp);

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Item da OS (lacuna B)
        await tx.itemOS.create({
          data: {
            ordemId: os.id,
            produtoNome,
            quantidade,
            precoUnitario,
            precoTotal: total,
            especificacoes: buildItemEspecificacoes(esp),
          },
        });

        // 2. Endereço de entrega (lacuna D)
        let enderecoEntregaId: string | undefined;
        if (modalidade === ModalidadeEntrega.ENTREGA && endereco) {
          const end = await tx.endereco.create({
            data: {
              usuarioId: os.clienteId,
              apelido: 'Entrega (migrado)',
              logradouro: endereco.texto,
              referencia: endereco.referencia,
            },
          });
          enderecoEntregaId = end.id;
        }

        // 3. Arte final aprovada (lacuna C)
        let arteAprovadaId: string | undefined;
        if (arteUrl) {
          const arq = await tx.arquivoOS.create({
            data: { ordemId: os.id, tipo: TipoArquivo.ARTE_FINAL, url: arteUrl, aprovado: true },
          });
          arteAprovadaId = arq.id;
        }

        // 4. Denormalização de leitura na OS (lacunas A/D)
        await tx.ordensDeServico.update({
          where: { id: os.id },
          data: {
            valorTotal: total,
            modalidadeEntrega: modalidade,
            ...(enderecoEntregaId ? { enderecoEntregaId } : {}),
            ...(arteAprovadaId ? { arteAprovadaId } : {}),
          },
        });
      });
      ok++;
    } catch (err) {
      console.error(`❌ Falha ao backfillar OS ${os.id}:`, err);
    }
  }

  console.log(`✅ Backfill concluído: ${ok}/${ordens.length} OS migradas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
