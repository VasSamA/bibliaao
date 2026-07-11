import Link from 'next/link';

export const metadata = { title: 'Bíblia Online — Biblia.ao' };

type Livro = { slug: string; name: string; testament: 'AT' | 'NT' };

// Usado apenas se a API estiver indisponível.
const VERSAO_FALLBACK = 'ARA';
const LIVROS_FALLBACK: Livro[] = [
  { slug: 'genesis', name: 'Génesis', testament: 'AT' },
  { slug: 'salmos', name: 'Salmos', testament: 'AT' },
  { slug: 'joao', name: 'João', testament: 'NT' },
  { slug: 'romanos', name: 'Romanos', testament: 'NT' },
];

async function getVersaoPadrao(apiUrl: string): Promise<string> {
  const res = await fetch(`${apiUrl}/biblia/versoes`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao obter versões.');
  const versoes: Array<{ code: string; isDefault: boolean }> = await res.json();
  return versoes.find((v) => v.isDefault)?.code ?? versoes[0]?.code ?? VERSAO_FALLBACK;
}

async function getLivros(): Promise<{ versao: string; livros: Livro[] }> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const versao = await getVersaoPadrao(apiUrl);
    const res = await fetch(`${apiUrl}/biblia/${versao}/livros`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const livros: Livro[] = (Array.isArray(data) ? data : data.livros ?? []).map((b: any) => ({
        slug: b.slug,
        name: b.name,
        testament: b.testament,
      }));
      if (livros.length > 0) return { versao, livros };
    }
  } catch {
    // API indisponível — usar conteúdo de exemplo abaixo.
  }
  return { versao: VERSAO_FALLBACK, livros: LIVROS_FALLBACK };
}

export default async function BibliaPage() {
  const { versao, livros } = await getLivros();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-serif text-3xl font-semibold mb-2">Bíblia Online</h1>
      <p className="text-sacred-600 dark:text-parchment-200 mb-8">
        Escolhe um livro para começar a ler. Versão atual: <strong>{versao}</strong>.
      </p>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 rounded bg-parchment-200 px-3 py-2 font-medium text-sacred-700 dark:bg-sacred-900 dark:text-parchment-100">
            Antigo Testamento
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {livros.filter((l) => l.testament === 'AT').map((l) => (
              <Link
                key={l.slug}
                href={`/biblia/${versao}/${l.slug}/1`}
                className="rounded-md border border-parchment-200 bg-parchment-50 px-3 py-2 text-center text-sm text-sacred-700 transition hover:border-gold-500 hover:bg-gold-400/10 hover:text-gold-600 dark:border-sacred-700 dark:bg-sacred-900 dark:text-parchment-100 dark:hover:border-gold-400 dark:hover:text-gold-400"
              >
                {l.name}
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-4 rounded bg-parchment-200 px-3 py-2 font-medium text-sacred-700 dark:bg-sacred-900 dark:text-parchment-100">
            Novo Testamento
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {livros.filter((l) => l.testament === 'NT').map((l) => (
              <Link
                key={l.slug}
                href={`/biblia/${versao}/${l.slug}/1`}
                className="rounded-md border border-parchment-200 bg-parchment-50 px-3 py-2 text-center text-sm text-sacred-700 transition hover:border-gold-500 hover:bg-gold-400/10 hover:text-gold-600 dark:border-sacred-700 dark:bg-sacred-900 dark:text-parchment-100 dark:hover:border-gold-400 dark:hover:text-gold-400"
              >
                {l.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
