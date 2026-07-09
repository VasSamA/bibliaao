export const metadata = { title: 'Área de Líderes — Biblia.ao' };

const ITENS = [
  'Publicar estudos e devocionais',
  'Gerir eventos da igreja',
  'Publicar recursos para a comunidade',
  'Acompanhar métricas de engajamento',
];

export default function LideresPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-4">Área de Líderes</h1>
      <p className="text-sacred-600 dark:text-parchment-200 mb-8">
        Ferramentas para líderes, pastores e editores de conteúdo publicarem e geriram material
        para as suas comunidades.
      </p>
      <ul className="space-y-2">
        {ITENS.map((i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" /> {i}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-sacred-500">
        Acesso restrito a utilizadores com perfil Líder, Pastor, Editor de Conteúdo ou superior.
      </p>
    </div>
  );
}
