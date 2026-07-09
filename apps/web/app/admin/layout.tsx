import Link from 'next/link';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/conteudos', label: 'Conteúdos' },
  { href: '/admin/utilizadores', label: 'Utilizadores' },
  { href: '/admin/igrejas', label: 'Igrejas' },
  { href: '/admin/recursos', label: 'Recursos' },
  { href: '/admin/comentarios', label: 'Comentários' },
  { href: '/admin/relatorios', label: 'Relatórios' },
  { href: '/admin/configuracoes', label: 'Configurações' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-10">
      <aside className="w-56 shrink-0">
        <p className="mb-4 font-serif text-lg font-semibold">Painel Administrativo</p>
        <nav className="space-y-1 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 hover:bg-sacred-100 dark:hover:bg-sacred-800">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
