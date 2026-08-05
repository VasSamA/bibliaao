export const metadata = { title: 'Estudos Bíblicos — Biblia.ao' };

const FALLBACK = [
  { slug: 'exemplo-fe-em-acao', title: 'Fé em ação: a carta de Tiago', summary: 'Um estudo sobre como a fé genuína se manifesta em obras práticas.' },
  { slug: 'exemplo-salmos-de-lamento', title: 'Salmos de lamento', summary: 'Como a Bíblia nos ensina a lamentar honestamente diante de Deus.' },
];

async function getStudies() {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/estudos`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {}
  return FALLBACK;
}

const AFIRMACAO = ['Única', 'Clara', 'Suficiente', 'Inerrante', 'Autoridade Final'];

export default async function EstudosPage() {
  const studies = await getStudies();
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-6">Estudos Bíblicos</h1>

      <div className="mb-10 rounded-xl border border-gold-500/40 bg-parchment-100 dark:bg-sacred-900 dark:border-gold-400/30 px-5 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gold-600 dark:text-gold-400 mb-2">
          O que cremos sobre a Bíblia
        </p>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-sacred-700 dark:text-parchment-100">
          {AFIRMACAO.map((palavra, i) => (
            <span key={palavra}>
              <strong className="font-semibold">{palavra}</strong>
              {i < AFIRMACAO.length - 1 && <span className="text-sacred-300 dark:text-sacred-600"> · </span>}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {studies.map((s: any) => (
          <a key={s.slug} href={`/estudos/${s.slug}`} className="rounded-2xl border border-sacred-100 dark:border-sacred-700 p-5 hover:shadow-md transition-shadow">
            <h2 className="font-serif text-lg font-semibold mb-2">{s.title}</h2>
            <p className="text-sm text-sacred-600 dark:text-parchment-200">{s.summary}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
