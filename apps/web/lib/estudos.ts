/**
 * Estudos e Reflexões: acesso aos dados e leitura das convenções editoriais.
 *
 * O modelo `Study` não tem campos próprios para série, formato, referências
 * bíblicas ou fontes. Em vez de uma migração à BD de produção, usa-se o que já
 * existe:
 *  - tema           -> `category`
 *  - série          -> tag `serie:<slug>` (só séries conhecidas abaixo)
 *  - formato        -> tag `formato:<artigo|reflexao|estudo|video|audio>`
 *  - referências, fontes, créditos, autoria e revisão -> secções `## ...` do
 *    corpo (`content`), lidas por `lerSecoes()`.
 * Só chega aqui conteúdo PUBLICADO: a API responde 404 aos restantes.
 */
const API_URL = process.env.API_URL ?? 'http://localhost:4000/api/v1';

export type Estudo = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImageUrl: string | null;
  category: string | null;
  tags: string[];
  status?: string;
  publishedAt: string | null;
};

export type Livro = { slug: string; name: string };

export const SERIES: Record<string, { titulo: string; descricao: string }> = {
  'a-grande-controversia': {
    titulo: 'A Grande Controvérsia',
    descricao:
      'Série de conteúdos relacionados com a obra A Grande Controvérsia, de Ellen G. White, escrita a partir de uma perspectiva adventista. Cada conteúdo é examinado à luz das Escrituras e identifica a obra de apoio.',
  },
};

const FORMATOS: Record<string, string> = {
  artigo: 'Artigo',
  reflexao: 'Reflexão',
  estudo: 'Estudo',
  video: 'Vídeo',
  audio: 'Áudio',
};

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function serieDe(estudo: Pick<Estudo, 'tags'>): { slug: string; titulo: string; descricao: string } | null {
  for (const tag of estudo.tags ?? []) {
    if (!tag.startsWith('serie:')) continue;
    const slug = tag.slice('serie:'.length);
    if (SERIES[slug]) return { slug, ...SERIES[slug] };
  }
  return null;
}

export function formatoDe(estudo: Pick<Estudo, 'tags'>): string {
  for (const tag of estudo.tags ?? []) {
    if (!tag.startsWith('formato:')) continue;
    const rotulo = FORMATOS[tag.slice('formato:'.length)];
    if (rotulo) return rotulo;
  }
  return 'Estudo';
}

export function dataReal(iso: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return null;
  return data.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function getEstudosPublicados(
  filtros: { category?: string; serie?: string } = {},
): Promise<{ estudos: Estudo[]; erro: boolean }> {
  const params = new URLSearchParams();
  if (filtros.category) params.set('category', filtros.category);
  if (filtros.serie) params.set('tag', `serie:${filtros.serie}`);
  const query = params.toString();
  try {
    const res = await fetch(`${API_URL}/estudos${query ? `?${query}` : ''}`, { cache: 'no-store' });
    if (!res.ok) return { estudos: [], erro: true };
    const dados = await res.json();
    let estudos: Estudo[] = Array.isArray(dados) ? dados : [];
    // Filtra também aqui: uma API mais antiga ignora os parâmetros acima.
    if (filtros.category) estudos = estudos.filter((e) => e.category === filtros.category);
    if (filtros.serie) estudos = estudos.filter((e) => e.tags?.includes(`serie:${filtros.serie}`));
    return { estudos, erro: false };
  } catch {
    return { estudos: [], erro: true };
  }
}

export async function getEstudoPublicado(slug: string): Promise<{ estudo: Estudo | null; erro: boolean }> {
  try {
    const res = await fetch(`${API_URL}/estudos/${encodeURIComponent(slug)}`, { cache: 'no-store' });
    if (res.status === 404) return { estudo: null, erro: false };
    if (!res.ok) return { estudo: null, erro: true };
    const estudo: Estudo = await res.json();
    // Defesa em profundidade: nunca mostrar algo que a API não marque como publicado.
    if (estudo.status !== 'PUBLICADO') return { estudo: null, erro: false };
    return { estudo, erro: false };
  } catch {
    return { estudo: null, erro: true };
  }
}

export async function getLivrosPadrao(): Promise<{ versao: string; livros: Livro[] } | null> {
  try {
    const rv = await fetch(`${API_URL}/biblia/versoes`, { cache: 'no-store' });
    if (!rv.ok) return null;
    const versoes: Array<{ code: string; isDefault: boolean }> = await rv.json();
    const versao = versoes.find((v) => v.isDefault)?.code ?? versoes[0]?.code;
    if (!versao) return null;
    const rl = await fetch(`${API_URL}/biblia/${versao}/livros`, { cache: 'no-store' });
    if (!rl.ok) return null;
    return { versao, livros: await rl.json() };
  } catch {
    return null;
  }
}

export type Secoes = {
  corpo: string;
  referencias: string[];
  fontes: string[];
  creditos: string[];
  autoria: string[];
};

const SECOES_ESPECIAIS: Record<string, keyof Omit<Secoes, 'corpo'>> = {
  'referencias biblicas': 'referencias',
  'fontes de apoio': 'fontes',
  creditos: 'creditos',
  'autoria e revisao': 'autoria',
};

/** Separa o corpo das secções editoriais (`## Referências bíblicas`, `## Fontes de apoio`, ...). */
export function lerSecoes(conteudo: string): Secoes {
  const secoes: Secoes = { corpo: '', referencias: [], fontes: [], creditos: [], autoria: [] };
  const corpo: string[] = [];
  let atual: keyof Omit<Secoes, 'corpo'> | null = null;

  for (const linha of conteudo.replace(/\r\n/g, '\n').split('\n')) {
    const titulo = /^##\s+(.+?)\s*$/.exec(linha);
    if (titulo) {
      atual = SECOES_ESPECIAIS[normalizar(titulo[1])] ?? null;
      if (!atual) corpo.push(linha);
      continue;
    }
    if (atual) {
      const item = linha.replace(/^\s*[-*]\s+/, '').trim();
      if (item) secoes[atual].push(item);
    } else {
      corpo.push(linha);
    }
  }
  secoes.corpo = corpo.join('\n').trim();
  return secoes;
}

/**
 * Liga uma referência como "Lucas 19:41-44" ao leitor bíblico existente.
 * Sem correspondência segura a um livro real, devolve null (fica texto simples).
 */
export function hrefDaReferencia(referencia: string, versao: string, livros: Livro[]): string | null {
  const m = /^(.*?[A-Za-zÀ-ÿ])\s+(\d{1,3})(?=\s*(?::|,|\.|;|$))/.exec(referencia.trim());
  if (!m) return null;
  const nome = normalizar(m[1]).replace(/\s+/g, ' ');
  const livro = livros.find((l) => normalizar(l.name) === nome || l.slug === nome.replace(/ /g, '-'));
  if (!livro) return null;
  return `/biblia/${versao}/${livro.slug}/${Number(m[2])}`;
}
