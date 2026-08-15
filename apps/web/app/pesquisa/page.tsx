import Link from 'next/link';

type Verso = {
  id: string;
  text: string;
  reference: string;
  chapter?: { number: number; book: { slug: string; name: string; version: { code: string } } } | null;
};
type Estudo = { id: string; slug: string; title: string; summary: string };
type Artigo = { id: string; title: string; excerpt: string };
type Recurso = { id: string; title: string; description: string | null; fileUrl: string };
type Igreja = { id: string; name: string; city: string; province: string; denomination: string | null };

type Resultados = { verses: Verso[]; studies: Estudo[]; articles: Artigo[]; resources: Recurso[]; churches: Igreja[] };

const VAZIO: Resultados = { verses: [], studies: [], articles: [], resources: [], churches: [] };
const API_URL = process.env.API_URL ?? 'http://localhost:4000/api/v1';

async function getResultados(q: string): Promise<Resultados> {
  try {
    const res = await fetch(`${API_URL}/pesquisa?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
    if (!res.ok) return VAZIO;
    return await res.json();
  } catch {
    return VAZIO;
  }
}

export const metadata = { title: 'Pesquisar — Biblia.ao' };

export default async function PesquisaPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? '').trim();
  const resultados = q ? await getResultados(q) : VAZIO;
  const total =
    resultados.verses.length +
    resultados.studies.length +
    resultados.articles.length +
    resultados.resources.length +
    resultados.churches.length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-sacred-900 dark:text-parchment-50">Pesquisar</h1>

      <form
        action="/pesquisa"
        className="mb-10 flex items-center gap-2 rounded-full border border-sacred-100 bg-white p-1.5 pl-5 dark:border-sacred-700 dark:bg-sacred-800"
      >
        <span aria-hidden className="text-sacred-400 dark:text-parchment-300">⌕</span>
        <label htmlFor="q" className="sr-only">Pesquisar na Bíblia</label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="Pesquise um livro, capítulo ou tema..."
          className="flex-1 bg-transparent py-2.5 text-sm text-sacred-900 placeholder:text-sacred-300 focus:outline-none dark:text-parchment-50 dark:placeholder:text-parchment-300"
        />
        <button
          type="submit"
          className="rounded-full bg-sacred-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-sacred-600 dark:bg-gold-500 dark:text-sacred-900 dark:hover:bg-gold-400"
        >
          Pesquisar
        </button>
      </form>

      {!q ? (
        <p className="text-sacred-400 dark:text-parchment-200">
          Escreva um termo para pesquisar na Bíblia, estudos, artigos, recursos e igrejas.
        </p>
      ) : total === 0 ? (
        <p className="text-sacred-400 dark:text-parchment-200">Não encontrámos resultados para &ldquo;{q}&rdquo;.</p>
      ) : (
        <div className="space-y-12">
          {resultados.verses.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
                Versículos
              </h2>
              <div className="space-y-3">
                {resultados.verses.map((v) =>
                  v.chapter ? (
                    <Link
                      key={v.id}
                      href={`/biblia/${v.chapter.book.version.code}/${v.chapter.book.slug}/${v.chapter.number}`}
                      className="block rounded-lg border border-sacred-100 p-4 hover:border-gold-400 dark:border-sacred-700"
                    >
                      <p className="text-sm text-sacred-700 dark:text-parchment-100">{v.text}</p>
                      <p className="mt-2 text-xs font-bold text-gold-600 dark:text-gold-400">{v.reference}</p>
                    </Link>
                  ) : (
                    <div key={v.id} className="rounded-lg border border-sacred-100 p-4 dark:border-sacred-700">
                      <p className="text-sm text-sacred-700 dark:text-parchment-100">{v.text}</p>
                      <p className="mt-2 text-xs font-bold text-gold-600 dark:text-gold-400">{v.reference}</p>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          {resultados.studies.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
                Estudos
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {resultados.studies.map((s) => (
                  <Link
                    key={s.id}
                    href={`/estudos/${s.slug}`}
                    className="block rounded-lg border border-sacred-100 p-4 hover:border-gold-400 dark:border-sacred-700"
                  >
                    <h3 className="font-serif text-lg font-semibold text-sacred-900 dark:text-parchment-50">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-sm text-sacred-600 dark:text-parchment-200">{s.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {resultados.articles.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
                  Artigos
                </h2>
                <Link
                  href="/blog"
                  className="text-xs font-bold text-sacred-700 hover:text-gold-600 dark:text-parchment-100 dark:hover:text-gold-400"
                >
                  Ver blog →
                </Link>
              </div>
              <div className="space-y-3">
                {resultados.articles.map((a) => (
                  <div key={a.id} className="rounded-lg border border-sacred-100 p-4 dark:border-sacred-700">
                    <h3 className="font-serif text-lg font-semibold text-sacred-900 dark:text-parchment-50">
                      {a.title}
                    </h3>
                    <p className="mt-1 text-sm text-sacred-600 dark:text-parchment-200">{a.excerpt}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {resultados.resources.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
                Recursos
              </h2>
              <div className="space-y-3">
                {resultados.resources.map((r) => (
                  <a
                    key={r.id}
                    href={r.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-sacred-100 p-4 hover:border-gold-400 dark:border-sacred-700"
                  >
                    <h3 className="font-serif text-lg font-semibold text-sacred-900 dark:text-parchment-50">
                      {r.title}
                    </h3>
                    {r.description && (
                      <p className="mt-1 text-sm text-sacred-600 dark:text-parchment-200">{r.description}</p>
                    )}
                    <p className="mt-2 text-xs font-bold text-gold-600 dark:text-gold-400">Descarregar →</p>
                  </a>
                ))}
              </div>
            </section>
          )}

          {resultados.churches.length > 0 && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
                  Igrejas
                </h2>
                <Link
                  href="/mapa-igrejas"
                  className="text-xs font-bold text-sacred-700 hover:text-gold-600 dark:text-parchment-100 dark:hover:text-gold-400"
                >
                  Ver mapa →
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {resultados.churches.map((c) => (
                  <div key={c.id} className="rounded-lg border border-sacred-100 p-4 dark:border-sacred-700">
                    <h3 className="font-serif text-lg font-semibold text-sacred-900 dark:text-parchment-50">
                      {c.name}
                    </h3>
                    <p className="mt-1 text-xs text-sacred-500 dark:text-parchment-200">
                      {c.city}, {c.province}
                      {c.denomination ? ` · ${c.denomination}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
