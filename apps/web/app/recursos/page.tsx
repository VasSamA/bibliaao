export const metadata = { title: 'Biblioteca de Recursos — Biblia.ao' };

const TIPOS = ['PDF', 'SLIDE', 'IMAGEM', 'AUDIO', 'VIDEO', 'CERTIFICADO'];

async function getResources() {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/recursos`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {}
  return [];
}

export default async function RecursosPage() {
  const resources = await getResources();
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-2">Biblioteca de Recursos</h1>
      <p className="text-sacred-600 dark:text-parchment-200 mb-8">
        PDFs, slides, imagens, áudios, vídeos e materiais para igrejas e líderes.
      </p>

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        {TIPOS.map((t) => (
          <span key={t} className="rounded-full border border-sacred-200 dark:border-sacred-700 px-3 py-1">{t}</span>
        ))}
      </div>

      {resources.length === 0 ? (
        <p className="text-sm text-sacred-500">Ainda não há recursos publicados. Volta em breve.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {resources.map((r: any) => (
            <a key={r.id} href={r.fileUrl} target="_blank" className="rounded-xl border border-sacred-100 dark:border-sacred-700 p-4 hover:shadow-md">
              <p className="text-xs text-gold-600 mb-1">{r.type}</p>
              <p className="font-medium">{r.title}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
