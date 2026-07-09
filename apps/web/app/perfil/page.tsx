export const metadata = { title: 'O Meu Perfil — Biblia.ao' };

export default function PerfilPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-8">O Meu Perfil</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {['Favoritos', 'Notas', 'Histórico de Leitura', 'Planos de Leitura', 'Perguntas à IA', 'Definições'].map((t) => (
          <div key={t} className="rounded-2xl border border-sacred-100 dark:border-sacred-700 p-5">
            <p className="font-medium">{t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
