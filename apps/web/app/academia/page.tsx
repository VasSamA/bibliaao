export const metadata = { title: 'Academia Bíblica — Biblia.ao' };

const FALLBACK = [
  { slug: 'fundamentos-da-fe', title: 'Fundamentos da Fé', level: 'iniciante', description: 'Os pilares essenciais da doutrina cristã.' },
  { slug: 'hermeneutica-basica', title: 'Hermenêutica Básica', level: 'intermedio', description: 'Como interpretar corretamente as Escrituras.' },
];

async function getCourses() {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/academia`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {}
  return FALLBACK;
}

export default async function AcademiaPage() {
  const courses = await getCourses();
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-2">Academia Bíblica</h1>
      <p className="text-sacred-600 dark:text-parchment-200 mb-8">Cursos estruturados para crescer no conhecimento das Escrituras.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        {courses.map((c: any) => (
          <a key={c.slug} href={`/academia/${c.slug}`} className="rounded-2xl border border-sacred-100 dark:border-sacred-700 p-5 hover:shadow-md transition-shadow">
            <span className="mb-2 inline-block rounded-full bg-gold-500/10 px-2 py-0.5 text-xs text-gold-600 dark:text-gold-400 capitalize">{c.level}</span>
            <h2 className="font-serif text-lg font-semibold mb-2">{c.title}</h2>
            <p className="text-sm text-sacred-600 dark:text-parchment-200">{c.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
