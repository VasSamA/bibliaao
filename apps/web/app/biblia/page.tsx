import Link from 'next/link';

export const metadata = { title: 'Bíblia Online — Biblia.ao' };

type Livro = { slug: string; name: string; testament: 'AT' | 'NT' };

const VERSAO_PADRAO = 'ARA';

// Usado apenas se a API estiver indisponível.
const LIVROS_FALLBACK: Livro[] = [
  { slug: 'genesis', name: 'Génesis', testament: 'AT' },
  { slug: 'salmos', name: 'Salmos', testament: 'AT' },
  { slug: 'joao', name: 'João', testament: 'NT' },
  { slug: 'romanos', name: 'Romanos', testament: 'NT' },
];

async function getLivros(versao: string): Promise<{ versao: string; livros: Livro[] }> {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000/api/v1';
  try {
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
  return { versao: VERSAO_PADRAO, livros: LIVROS_FALLBACK };
}

export default async function BibliaPage() {
  const { versao, livros } = await getLivros(VERSAO_PADRAO);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-serif text-3xl font-semibold mb-2">Bíblia Online</h1>
      <p className="text-sacred-600 dark:text-parchment-200 mb-8">
        Escolhe um livro para começar a ler. Versão atual: <strong>{versao}</strong>.
      </p>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 font-medium text-gold-600 dark:text-gold-400">Antigo Testamento</h2>
          <ul className="space-y-1">
            {livros.filter((l) => l.testament === 'AT').map((l) => (
              <li key={l.slug}>
                <Link href={`/biblia/${versao}/${l.slug}/1`} className="hover:text-gold-600 dark:hover:text-gold-400">
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-medium text-gold-600 dark:text-gold-400">Novo Testamento</h2>
          <ul className="space-y-1">
            {livros.filter((l) => l.testament === 'NT').map((l) => (
              <li key={l.slug}>
                <Link href={`/biblia/${versao}/${l.slug}/1`} className="hover:text-gold-600 dark:hover:text-gold-400">
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
