import Link from 'next/link';

export const metadata = { title: 'O Meu Perfil — Biblia.ao' };

const SECTIONS = [
  { title: 'Favoritos', href: null },
  { title: 'Notas', href: null },
  { title: 'Histórico de Leitura', href: null },
  { title: 'Planos de Leitura', href: null },
  { title: 'Perguntas à IA', href: null },
  { title: 'Definições', href: '/perfil/definicoes' },
];

export default function PerfilPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-8">O Meu Perfil</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) =>
          s.href ? (
            <Link
              key={s.title}
              href={s.href}
              className="rounded-2xl border border-sacred-100 dark:border-sacred-700 p-5 hover:shadow-md transition-shadow"
            >
              <p className="font-medium">{s.title}</p>
            </Link>
          ) : (
            <div key={s.title} className="rounded-2xl border border-sacred-100 dark:border-sacred-700 p-5 opacity-60">
              <p className="font-medium">{s.title}</p>
              <p className="text-xs text-sacred-500 mt-1">Em breve</p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
