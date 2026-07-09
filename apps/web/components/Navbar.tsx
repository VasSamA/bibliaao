import Link from 'next/link';
import { BookOpen, Menu } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { href: '/biblia', label: 'Bíblia' },
  { href: '/devocional', label: 'Devocional' },
  { href: '/estudos', label: 'Estudos' },
  { href: '/academia', label: 'Academia' },
  { href: '/pergunte-a-biblia', label: 'Pergunte à Bíblia' },
  { href: '/recursos', label: 'Recursos' },
  { href: '/infantil', label: 'Infantil' },
  { href: '/mapa-igrejas', label: 'Igrejas' },
  { href: '/blog', label: 'Blog' },
  { href: '/comunidade', label: 'Comunidade' },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-sacred-100 dark:border-sacred-700 bg-parchment-50/90 dark:bg-sacred-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold text-sacred-700 dark:text-gold-400">
          <BookOpen size={22} />
          Biblia<span className="text-gold-500">.ao</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-5 text-sm">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-gold-600 dark:hover:text-gold-400 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden sm:inline-flex rounded-full border border-sacred-600 px-4 py-1.5 text-sm text-sacred-700 dark:text-parchment-100 dark:border-gold-400 hover:bg-sacred-600 hover:text-white dark:hover:bg-gold-500 transition-colors"
          >
            Entrar
          </Link>
          <button className="lg:hidden rounded-full p-2 hover:bg-sacred-100 dark:hover:bg-sacred-700" aria-label="Abrir menu">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
