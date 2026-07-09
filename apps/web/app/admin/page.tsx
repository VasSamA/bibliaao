export const metadata = { title: 'Dashboard — Painel Administrativo' };

const FALLBACK_METRICS = {
  activeUsers: 0,
  totalUsers: 0,
  bibleReads: 0,
  aiQuestions: 0,
  churches: 0,
  pendingContent: 0,
  totalDownloads: 0,
  mostAccessedStudies: [] as { title: string; slug: string }[],
};

async function getMetrics() {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/analytics/dashboard`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {}
  return FALLBACK_METRICS;
}

const CARDS = [
  { key: 'activeUsers', label: 'Utilizadores ativos (30 dias)' },
  { key: 'totalUsers', label: 'Utilizadores totais' },
  { key: 'bibleReads', label: 'Leituras bíblicas' },
  { key: 'aiQuestions', label: 'Perguntas feitas à IA' },
  { key: 'churches', label: 'Igrejas cadastradas' },
  { key: 'pendingContent', label: 'Conteúdos pendentes de aprovação' },
  { key: 'totalDownloads', label: 'Downloads de recursos' },
] as const;

export default async function AdminDashboardPage() {
  const metrics = await getMetrics();
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold mb-6">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.key} className="rounded-2xl border border-sacred-100 dark:border-sacred-700 p-5">
            <p className="text-3xl font-semibold text-sacred-700 dark:text-gold-400">{metrics[c.key] ?? 0}</p>
            <p className="mt-1 text-sm text-sacred-600 dark:text-parchment-200">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="font-serif text-lg font-semibold mb-3">Estudos mais acedidos</h2>
        {metrics.mostAccessedStudies?.length ? (
          <ul className="space-y-1 text-sm">
            {metrics.mostAccessedStudies.map((s: any) => (
              <li key={s.slug}>{s.title}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-sacred-500">Sem dados ainda.</p>
        )}
      </div>
    </div>
  );
}
