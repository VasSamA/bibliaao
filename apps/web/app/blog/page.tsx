export const metadata = { title: 'Blog / Artigos — Biblia.ao' };

async function getArticles() {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/blog`, { cache: 'no-store' });
    if (res.ok) return res.json();
  } catch {}
  return [];
}

export default async function BlogPage() {
  const articles = await getArticles();
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-8">Blog / Artigos</h1>
      {articles.length === 0 ? (
        <p className="text-sm text-sacred-500">Ainda não há artigos publicados.</p>
      ) : (
        <div className="space-y-6">
          {articles.map((a: any) => (
            <a key={a.slug} href={`/blog/${a.slug}`} className="block rounded-2xl border border-sacred-100 dark:border-sacred-700 p-5 hover:shadow-md">
              <h2 className="font-serif text-xl font-semibold mb-1">{a.title}</h2>
              <p className="text-sm text-sacred-600 dark:text-parchment-200">{a.excerpt}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
