import Link from 'next/link';

type Livro = { slug: string; name: string; testament: 'AT' | 'NT'; chaptersCount: number };
type Devocional = { slug: string; title: string; date: string; verseReference: string; verseText: string };
type Estudo = { slug: string; title: string; summary: string; category: string | null };
type Plano = { slug: string; title: string; description: string; durationDays: number };

const API_URL = process.env.API_URL ?? 'http://localhost:4000/api/v1';

// Seleção editorial de bons pontos de entrada — filtrada contra os livros
// reais devolvidos pela API, nunca inventada.
const LIVROS_DESTAQUE_SLUGS = ['genesis', 'salmos', 'proverbios', 'mateus', 'joao', 'romanos'];
const TONS_LIVRO = ['#8a7256', '#1c4d59', '#a97a3a', '#4f7a6a', '#0d2935', '#8b5942'];

async function getVersaoPadrao(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/biblia/versoes`, { cache: 'no-store' });
    if (!res.ok) return null;
    const versoes: Array<{ code: string; isDefault: boolean }> = await res.json();
    return versoes.find((v) => v.isDefault)?.code ?? versoes[0]?.code ?? null;
  } catch {
    return null;
  }
}

async function getLivrosDestaque(): Promise<{ versao: string; livros: Livro[] }> {
  const versao = await getVersaoPadrao();
  if (!versao) return { versao: '', livros: [] };
  try {
    const res = await fetch(`${API_URL}/biblia/${versao}/livros`, { cache: 'no-store' });
    if (!res.ok) return { versao, livros: [] };
    const todos: Livro[] = await res.json();
    const destaque = LIVROS_DESTAQUE_SLUGS.map((slug) => todos.find((l) => l.slug === slug)).filter(
      (l): l is Livro => Boolean(l),
    );
    return { versao, livros: destaque.length > 0 ? destaque : todos.slice(0, 6) };
  } catch {
    return { versao, livros: [] };
  }
}

async function getDevocionalHoje(): Promise<Devocional | null> {
  try {
    const res = await fetch(`${API_URL}/devocionais/hoje`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getEstudosDestaque(): Promise<Estudo[]> {
  try {
    const res = await fetch(`${API_URL}/estudos`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.slice(0, 3) : [];
  } catch {
    return [];
  }
}

async function getPlanoDestaque(): Promise<Plano | null> {
  try {
    const res = await fetch(`${API_URL}/planos-leitura`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [{ versao, livros }, devocional, estudos, plano] = await Promise.all([
    getLivrosDestaque(),
    getDevocionalHoje(),
    getEstudosDestaque(),
    getPlanoDestaque(),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_76%_40%,#1c4d59_0%,#113642_31%,#0d2935_62%,#081319_100%)] px-4 py-24 text-center text-white sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-24 h-96 w-96 rounded-full border border-gold-400/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-52 top-4 h-[28rem] w-[28rem] rounded-full border border-gold-400/10"
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="mb-6 flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            <span className="h-px w-6 bg-gold-400/60" /> A Palavra mais perto de si
            <span className="h-px w-6 bg-gold-400/60" />
          </p>
          <h1 className="font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl">
            Leia. Compreenda.
            <br />
            <em className="font-medium not-italic text-gold-400">Viva a Palavra.</em>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-white/70">
            Uma plataforma bíblica feita em Angola, para todos. Descubra as Escrituras, aprofunde a sua fé
            e caminhe com propósito — todos os dias.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              href="/biblia"
              className="rounded bg-gold-500 px-7 py-3 text-sm font-semibold text-sacred-900 transition-colors hover:bg-gold-400"
            >
              Começar a ler
            </Link>
            <Link
              href="/registo"
              className="rounded border border-white/35 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Criar conta gratuita
            </Link>
          </div>
        </div>
      </section>

      {/* Palavra do Dia */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
              Palavra do dia
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold leading-tight text-sacred-900 dark:text-parchment-50 sm:text-5xl">
              Um momento com Deus,
              <br />
              todos os dias.
            </h2>
          </div>
          {devocional && (
            <p className="pb-1 text-xs capitalize text-sacred-400 dark:text-parchment-200">
              {new Date(devocional.date).toLocaleDateString('pt-PT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>

        {devocional ? (
          <article className="grid overflow-hidden rounded-lg bg-white shadow-xl dark:bg-sacred-900 sm:grid-cols-[42%_58%]">
            <div
              aria-hidden
              className="hidden bg-gradient-to-br from-gold-400 via-sacred-100 to-sacred-600 sm:block"
            />
            <div className="flex flex-col p-8 sm:p-12">
              <span className="font-serif text-6xl leading-none text-gold-500">&ldquo;</span>
              <blockquote className="mt-3 font-serif text-2xl font-medium leading-snug text-sacred-900 dark:text-parchment-50 sm:text-3xl">
                {devocional.verseText}
              </blockquote>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gold-600 dark:text-gold-400">
                {devocional.verseReference}
              </p>
              <div className="mt-auto flex items-center gap-3 border-t border-parchment-200 pt-6 dark:border-sacred-700">
                <Link
                  href={`/devocional/${devocional.slug}`}
                  className="mr-auto text-xs font-bold text-sacred-700 hover:text-gold-600 dark:text-parchment-100 dark:hover:text-gold-400"
                >
                  Ler a reflexão completa →
                </Link>
              </div>
            </div>
          </article>
        ) : (
          <p className="rounded-lg border border-dashed border-parchment-200 p-10 text-center text-sacred-400 dark:border-sacred-700 dark:text-parchment-200">
            Ainda não há um devocional publicado para hoje.
          </p>
        )}
      </section>

      {/* Livros */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
              Explore as Escrituras
            </p>
            <h2 className="mt-2 font-serif text-4xl font-semibold text-sacred-900 dark:text-parchment-50">
              Por onde quer começar?
            </h2>
          </div>
          <Link
            href="/biblia"
            className="text-xs font-bold text-sacred-700 hover:text-gold-600 dark:text-parchment-100 dark:hover:text-gold-400"
          >
            Ver todos os 66 livros →
          </Link>
        </div>
        {livros.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {livros.map((livro, i) => (
              <Link
                key={livro.slug}
                href={`/biblia/${versao}/${livro.slug}/1`}
                className="group relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded p-5 text-white transition-transform hover:-translate-y-1"
                style={{ backgroundColor: TONS_LIVRO[i % TONS_LIVRO.length] }}
              >
                <span className="text-[10px] opacity-60">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-serif text-2xl font-semibold">{livro.name}</h3>
                  <p className="text-[10px] opacity-65">{livro.chaptersCount} capítulos</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sacred-400 dark:text-parchment-200">Não foi possível carregar os livros agora.</p>
        )}
      </section>

      {/* Estudos */}
      <section className="bg-sacred-900 py-24 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-400">Conheça para viver</p>
              <h2 className="mt-2 font-serif text-4xl font-semibold sm:text-5xl">Estudos que aprofundam.</h2>
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-white/50">
              Conteúdo bíblico claro, fiel às Escrituras e conectado à vida real.
            </p>
          </div>
          {estudos.length > 0 ? (
            <div className="divide-y divide-white/10 border-t border-white/10">
              {estudos.map((estudo, i) => (
                <Link
                  key={estudo.slug}
                  href={`/estudos/${estudo.slug}`}
                  className="grid grid-cols-[40px_1fr] items-center gap-6 py-10 sm:grid-cols-[90px_1fr_48px]"
                >
                  <span className="font-serif text-lg text-gold-400">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    {estudo.category && (
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-400">
                        {estudo.category}
                      </p>
                    )}
                    <h3 className="font-serif text-2xl font-medium leading-tight sm:text-3xl">{estudo.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">{estudo.summary}</p>
                  </div>
                  <span className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/25 text-gold-400 sm:flex">
                    ↗
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="border-t border-white/10 pt-10 text-white/50">Ainda não há estudos publicados.</p>
          )}
        </div>
      </section>

      {/* Plano de leitura */}
      <section className="mx-auto max-w-6xl px-4 py-28">
        {plano ? (
          <div className="grid overflow-hidden rounded-lg bg-parchment-100 dark:bg-sacred-700 sm:grid-cols-2">
            <div className="p-10 sm:p-16">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
                Planos de leitura
              </p>
              <h2 className="mt-3 font-serif text-4xl font-semibold text-sacred-900 dark:text-parchment-50">
                Pequenos passos.
                <br />
                Uma fé mais profunda.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-sacred-600 dark:text-parchment-200">
                {plano.description}
              </p>
              <Link
                href="/perfil"
                className="mt-6 inline-flex rounded bg-sacred-700 px-5 py-3 text-xs font-bold text-white hover:bg-sacred-600 dark:bg-gold-500 dark:text-sacred-900 dark:hover:bg-gold-400"
              >
                Começar este plano →
              </Link>
            </div>
            <div className="m-6 rounded-md bg-gradient-to-br from-sacred-700 to-sacred-900 p-10 text-white sm:m-12">
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-gold-400">Plano em destaque</p>
              <h3 className="mt-3 text-2xl font-semibold">{plano.title}</h3>
              <p className="mt-3 text-xs text-white/60">{plano.durationDays} dias de leitura guiada</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-sacred-400 dark:text-parchment-200">
            Ainda não há planos de leitura publicados.
          </p>
        )}
      </section>

      {/* Missão */}
      <section className="relative overflow-hidden bg-gold-600 px-6 py-28 text-center text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-52 -top-64 h-[28rem] w-[28rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-52 -bottom-72 h-[28rem] w-[28rem] rounded-full border border-white/10"
        />
        <div className="relative mx-auto max-w-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/45 text-2xl">
            ✦
          </div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em]">O nosso propósito</p>
          <h2 className="mt-4 font-serif text-4xl font-semibold sm:text-6xl">
            Uma extensão do amor de Cristo,
            <br />
            ao alcance de cada pessoa.
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-white/85">
            O Bíblia.ao nasce para tornar a revelação de Deus acessível, compreensível e presente na vida
            diária — de Angola para o mundo.
          </p>
          <Link href="/comunidade" className="mt-8 inline-flex rounded bg-white px-6 py-3 text-xs font-bold text-sacred-900">
            Conheça o projeto →
          </Link>
        </div>
      </section>
    </div>
  );
}
