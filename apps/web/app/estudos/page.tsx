import Link from 'next/link';
import { SERIES, dataReal, formatoDe, getEstudosPublicados, serieDe, type Estudo } from '@/lib/estudos';

export const metadata = {
  title: 'Estudos e Reflexões - Biblia.ao',
  description: 'Conteúdos para conhecer melhor a Palavra de Deus, esclarecer dúvidas e crescer na fé em Cristo.',
};

const AFIRMACAO = ['Única', 'Clara', 'Suficiente', 'Inerrante', 'Autoridade Final'];

function Cartao({ estudo }: { estudo: Estudo }) {
  const data = dataReal(estudo.publishedAt);
  const serie = serieDe(estudo);
  return (
    <Link
      href={`/estudos/${estudo.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-sacred-100 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 dark:border-sacred-700"
    >
      {estudo.coverImageUrl && (
        // Imagem decorativa: o título do cartão já descreve o conteúdo.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={estudo.coverImageUrl} alt="" loading="lazy" className="h-40 w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-gold-700 dark:text-gold-400">
          {[estudo.category, formatoDe(estudo)].filter(Boolean).join(' · ')}
        </p>
        <h2 className="mb-2 font-serif text-xl font-semibold text-sacred-900 group-hover:text-gold-600 dark:text-parchment-50 dark:group-hover:text-gold-400">
          {estudo.title}
        </h2>
        <p className="text-sm text-sacred-600 dark:text-parchment-200">{estudo.summary}</p>
        {(serie || data) && (
          <p className="mt-auto pt-4 text-xs text-sacred-400 dark:text-parchment-200">
            {[serie?.titulo, data].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function EstudosPage({ searchParams }: { searchParams: { serie?: string; tema?: string } }) {
  const serieAtiva = searchParams.serie && SERIES[searchParams.serie] ? searchParams.serie : undefined;
  const tema = searchParams.tema?.trim() || undefined;
  const filtrado = Boolean(serieAtiva || tema);

  const todos = await getEstudosPublicados();
  const lista = filtrado ? await getEstudosPublicados({ category: tema, serie: serieAtiva }) : todos;

  const temas = Array.from(new Set(todos.estudos.map((e) => e.category).filter((c): c is string => Boolean(c))));
  const seriesComConteudo = Object.entries(SERIES).filter(([slug]) =>
    todos.estudos.some((e) => e.tags?.includes(`serie:${slug}`)),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="mb-3 font-serif text-3xl font-semibold text-sacred-900 dark:text-parchment-50">
        Estudos e Reflexões
      </h1>
      <p className="mb-8 max-w-2xl text-sacred-600 dark:text-parchment-200">
        Conteúdos para conhecer melhor a Palavra de Deus, esclarecer dúvidas e crescer na fé em Cristo.
      </p>

      <div className="mb-10 rounded-xl border border-gold-500/40 bg-parchment-100 px-5 py-4 dark:border-gold-400/30 dark:bg-sacred-900">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gold-700 dark:text-gold-400">
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

      {seriesComConteudo.map(([slug, serie]) => (
        <section
          key={slug}
          aria-labelledby={`serie-${slug}`}
          className="mb-10 rounded-xl bg-sacred-900 px-6 py-6 text-white"
        >
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-400">Série</p>
          <h2 id={`serie-${slug}`} className="font-serif text-2xl font-semibold">
            {serie.titulo}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">{serie.descricao}</p>
          {serieAtiva === slug ? (
            <Link href="/estudos" className="mt-4 inline-block text-xs font-bold text-gold-400 hover:text-gold-500">
              Ver todos os conteúdos →
            </Link>
          ) : (
            <Link
              href={`/estudos?serie=${slug}`}
              className="mt-4 inline-block text-xs font-bold text-gold-400 hover:text-gold-500"
            >
              Ver os conteúdos da série →
            </Link>
          )}
        </section>
      ))}

      {(temas.length > 1 || tema) && (
        <nav aria-label="Filtrar por tema" className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/estudos"
            aria-current={!tema ? 'true' : undefined}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${
              !tema
                ? 'border-sacred-700 bg-sacred-700 text-white dark:border-gold-500 dark:bg-gold-500 dark:text-sacred-900'
                : 'border-sacred-200 text-sacred-700 hover:border-gold-500 dark:border-sacred-600 dark:text-parchment-100'
            }`}
          >
            Todos os temas
          </Link>
          {temas.map((t) => (
            <Link
              key={t}
              href={`/estudos?tema=${encodeURIComponent(t)}`}
              aria-current={tema === t ? 'true' : undefined}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${
                tema === t
                  ? 'border-sacred-700 bg-sacred-700 text-white dark:border-gold-500 dark:bg-gold-500 dark:text-sacred-900'
                  : 'border-sacred-200 text-sacred-700 hover:border-gold-500 dark:border-sacred-600 dark:text-parchment-100'
              }`}
            >
              {t}
            </Link>
          ))}
        </nav>
      )}

      {lista.erro ? (
        <p role="status" className="rounded-xl border border-dashed border-sacred-200 p-8 text-center text-sacred-500 dark:border-sacred-700 dark:text-parchment-200">
          Não foi possível carregar os conteúdos neste momento. Tente novamente dentro de instantes.
        </p>
      ) : lista.estudos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sacred-200 p-8 text-center text-sacred-500 dark:border-sacred-700 dark:text-parchment-200">
          {filtrado ? (
            <>
              Não há conteúdos publicados para este filtro.{' '}
              <Link href="/estudos" className="font-semibold underline">
                Ver todos
              </Link>
            </>
          ) : (
            'Ainda não há conteúdos publicados. Volte em breve.'
          )}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {lista.estudos.map((e) => (
            <Cartao key={e.id} estudo={e} />
          ))}
        </div>
      )}
    </div>
  );
}
