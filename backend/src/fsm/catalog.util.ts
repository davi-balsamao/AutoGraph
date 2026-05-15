import * as fs from 'fs';
import * as path from 'path';

export interface CatalogItem {
  produto: string;
  descricao: string;
  requisitos_orcamento: string[];
}

let catalogCache: CatalogItem[] | null = null;

export function getCatalog(): CatalogItem[] {
  if (catalogCache) return catalogCache;
  const catalogoPath = path.join(__dirname, '../../data/catalogo.json');
  catalogCache = fs.existsSync(catalogoPath)
    ? JSON.parse(fs.readFileSync(catalogoPath, 'utf8'))
    : [];
  return catalogCache;
}

export function findCatalogProduct(nome: string): CatalogItem | undefined {
  return getCatalog().find((i) => i.produto.toLowerCase() === nome.toLowerCase());
}

/** Formata pergunta do catálogo para envio (uma pergunta, texto oficial). */
export function formatarPerguntaCatalogo(pergunta: string): string {
  const t = pergunta.trim();
  return t.endsWith('?') ? t : `${t}?`;
}
