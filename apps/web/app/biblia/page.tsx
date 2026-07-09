import Link from 'next/link';

export const metadata = { title: 'Bíblia Online — Biblia.ao' };

// Nota: em runtime isto viria de GET /biblia/versoes e /biblia/:versao/livros.
// Mantemos uma lista estática de fallback para o scaffold funcionar sem API a correr.
const VERSAO_PADRAO = 'ARA';
const LIVROS_EXEMPLO = [
  { slug: 'genesis', name: 'Génesis', testament: 'AT' },
  { slug: 'salmos', name: 'Salmos', testament: 'AT' },
  { slug: 'joao', name: 'João', testament: 'NT' },
  { slug: 'romanos', name: 'Romanos', testament: 'NT' },
];

export default function BibliaPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-serif text-3xl font-semibold mb-2">Bíblia Online</h1>
      <p className="text-sacred-600 dark:text-parchment-200 mb-8">
        Escolhe um livro para começar a ler. Versão atual: <strong>{VERSAO_PADRAO}</strong>.
      </p>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 font-medium text-gold-600 dark:text-gold-400">Antigo Testamento</h2>
          <ul className="space-y-1">
            {LIVROS_EXEMPLO.filter((l) => l.testament === 'AT').map((l) => (
              <li key={l.slug}>
                <Link href={`/biblia/${VERSAO_PADRAO}/${l.slug}/1`} className="hover:text-gold-600 dark:hover:text-gold-400">
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-medium text-gold-600 dark:text-gold-400">Novo Testamento</h2>
          <ul className="space-y-1">
            {LIVROS_EXEMPLO.filter((l) => l.testament === 'NT').map((l) => (
              <li key={l.slug}>
                <Link href={`/biblia/${VERSAO_PADRAO}/${l.slug}/1`} className="hover:text-gold-600 dark:hover:text-gold-400">
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
