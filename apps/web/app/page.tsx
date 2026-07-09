import Link from 'next/link';
import { BookOpen, GraduationCap, MessagesSquare, MapPin, Sparkles, Library } from 'lucide-react';

const MODULES = [
  { href: '/biblia', icon: BookOpen, title: 'Bíblia Online', desc: 'Leitura fluida por livro, capítulo e versículo, com pesquisa e comparação de versões.' },
  { href: '/estudos', icon: Library, title: 'Estudos Bíblicos', desc: 'Aprofunda a Palavra com estudos organizados por tema e livro.' },
  { href: '/devocional', icon: Sparkles, title: 'Devocional Diário', desc: 'Uma reflexão nova a cada dia, com oração e aplicação prática.' },
  { href: '/academia', icon: GraduationCap, title: 'Academia Bíblica', desc: 'Cursos estruturados para crescer no conhecimento das Escrituras.' },
  { href: '/pergunte-a-biblia', icon: MessagesSquare, title: 'Pergunte à Bíblia', desc: 'Tire dúvidas com respostas fundamentadas em referências bíblicas.' },
  { href: '/mapa-igrejas', icon: MapPin, title: 'Mapa de Igrejas', desc: 'Encontra igrejas e comunidades cristãs perto de ti.' },
];

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-16 text-center">
        <p className="mb-3 text-sm uppercase tracking-widest text-gold-600 dark:text-gold-400">
          Plataforma digital cristã
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-tight text-sacred-700 dark:text-parchment-50">
          A Palavra de Deus, ao alcance de todos em Angola e no mundo lusófono
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-sacred-600 dark:text-parchment-200">
          Leitura bíblica avançada, estudos, devocionais diários, recursos para igrejas e uma comunidade
          para crescer na fé — tudo num só lugar.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/biblia" className="rounded-full bg-sacred-600 px-6 py-3 text-white hover:bg-sacred-700 transition-colors">
            Começar a ler
          </Link>
          <Link href="/registo" className="rounded-full border border-sacred-600 px-6 py-3 text-sacred-700 dark:text-parchment-100 dark:border-gold-400 hover:bg-sacred-100 dark:hover:bg-sacred-700 transition-colors">
            Criar conta gratuita
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-sacred-100 dark:border-sacred-700 bg-white/60 dark:bg-sacred-900/40 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Icon className="mb-3 text-gold-600 dark:text-gold-400" size={28} />
              <h3 className="font-serif text-lg font-semibold mb-1">{title}</h3>
              <p className="text-sm text-sacred-600 dark:text-parchment-200">{desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
