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

export default async function EstudosPage() {
  const studies = await getStudies();
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-8">Estudos Bíblicos</h1>
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
