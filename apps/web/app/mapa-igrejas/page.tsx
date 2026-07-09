export const metadata = { title: 'Mapa de Igrejas — Biblia.ao' };

async function getChurches() {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/igrejas`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {}
  return [];
}

export default async function MapaIgrejasPage() {
  const churches = await getChurches();
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-2">Mapa de Igrejas</h1>
      <p className="text-sacred-600 dark:text-parchment-200 mb-8">
        Encontra igrejas e comunidades cristãs em Angola. A integração de mapa (Google Maps) fica em
        <code className="mx-1 rounded bg-sacred-100 dark:bg-sacred-800 px-1">GOOGLE_MAPS_API_KEY</code>.
      </p>

      {churches.length === 0 ? (
        <p className="text-sm text-sacred-500">Nenhuma igreja aprovada ainda. Submete a tua igreja para revisão.</p>
      ) : (
        <ul className="space-y-3">
          {churches.map((c: any) => (
            <li key={c.id} className="rounded-xl border border-sacred-100 dark:border-sacred-700 p-4">
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-sacred-600 dark:text-parchment-200">{c.address}, {c.city} — {c.province}</p>
            </li>
          ))}
        </ul>
      )}

      <a href="/mapa-igrejas/submeter" className="mt-8 inline-block rounded-full bg-sacred-600 px-5 py-2 text-white hover:bg-sacred-700">
        Submeter a minha igreja
      </a>
    </div>
  );
}
