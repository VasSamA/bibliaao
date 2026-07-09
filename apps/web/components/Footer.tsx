import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-sacred-100 dark:border-sacred-700 bg-parchment-100 dark:bg-sacred-900">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <p className="font-serif text-lg text-sacred-700 dark:text-gold-400 mb-2">Biblia.ao</p>
          <p className="text-sacred-600 dark:text-parchment-200">
            A melhor experiência digital de leitura, estudo e divulgação da Bíblia em Angola e no mundo lusófono.
          </p>
        </div>
        <div>
          <p className="font-medium mb-2">Explorar</p>
          <ul className="space-y-1">
            <li><Link href="/biblia">Bíblia Online</Link></li>
            <li><Link href="/estudos">Estudos Bíblicos</Link></li>
            <li><Link href="/devocional">Devocional Diário</Link></li>
            <li><Link href="/academia">Academia Bíblica</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-2">Comunidade</p>
          <ul className="space-y-1">
            <li><Link href="/mapa-igrejas">Mapa de Igrejas</Link></li>
            <li><Link href="/lideres">Área de Líderes</Link></li>
            <li><Link href="/comunidade">Comunidade</Link></li>
            <li><Link href="/blog">Blog / Artigos</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-2">Conta</p>
          <ul className="space-y-1">
            <li><Link href="/login">Entrar</Link></li>
            <li><Link href="/registo">Criar conta</Link></li>
            <li><Link href="/perfil">O meu perfil</Link></li>
          </ul>
        </div>
      </div>
      <p className="text-center text-xs text-sacred-500 dark:text-parchment-200 pb-6">
        © {new Date().getFullYear()} Biblia.ao — Feito com fé, para a glória de Deus.
      </p>
    </footer>
  );
}
