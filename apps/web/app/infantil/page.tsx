export const metadata = { title: 'Área Infantil — Biblia.ao' };

export default function InfantilPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 text-center">
      <h1 className="font-serif text-3xl font-semibold mb-4">Área Infantil 🌈</h1>
      <p className="text-sacred-600 dark:text-parchment-200 max-w-xl mx-auto">
        Histórias bíblicas ilustradas, atividades para colorir, vídeos e músicas para as crianças
        conhecerem o amor de Deus de forma divertida e segura.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {['Histórias Ilustradas', 'Atividades para Colorir', 'Músicas e Vídeos'].map((t) => (
          <div key={t} className="rounded-2xl border border-sacred-100 dark:border-sacred-700 p-6">
            <p className="font-serif text-lg font-semibold">{t}</p>
            <p className="mt-2 text-sm text-sacred-600 dark:text-parchment-200">Em breve disponível.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
