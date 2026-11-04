import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConteudoEstudo } from '@/components/ConteudoEstudo';
import { ShareButton } from '@/components/ShareButton';
import {
  dataReal,
  formatoDe,
  getEstudoPublicado,
  getEstudosPublicados,
  getLivrosPadrao,
  hrefDaReferencia,
  lerSecoes,
  serieDe,
} from '@/lib/estudos';

type Props = { params: { slug: string } };

// Metadados de partilha e indexação só existem para conteúdo realmente publicado.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { estudo } = await getEstudoPublicado(params.slug);
  if (!estudo) return { title: 'Conteúdo não encontrado - Biblia.ao', robots: { index: false } };
  return {
    title: `${estudo.title} - Biblia.ao`,
    description: estudo.summary,
    openGraph: {
      title: estudo.title,
      description: estudo.summary,
      type: 'article',
      ...(estudo.publishedAt ? { publishedTime: estudo.publishedAt } : {}),
      ...(estudo.coverImageUrl ? { images: [estudo.coverImageUrl] } : {}),
    },
  };
}

function Bloco({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-10 rounded-xl border border-sacred-100 p-6 dark:border-sacred-700">
      <h2 id={id} className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-gold-700 dark:text-gold-400">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export default async function EstudoPage({ params }: Props) {
  const { estudo, erro } = await getEstudoPublicado(params.slug);

  if (erro) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p role="status" className="rounded-xl border border-dashed border-sacred-200 p-8 text-center text-sacred-500 dark:border-sacred-700 dark:text-parchment-200">
          Não foi possível carregar este conteúdo neste momento. Tente novamente dentro de instantes.
        </p>
        <Link href="/estudos" className="mt-6 inline-block text-sm font-semibold text-sacred-700 hover:text-gold-600 dark:text-parchment-100">
          ← Estudos e Reflexões
        </Link>
      </div>
    );
  }
  if (!estudo) notFound();

  const secoes = lerSecoes(estudo.content);
  const serie = serieDe(estudo);
  const data = dataReal(estudo.publishedAt);

  const referencias = secoes.referencias.flatMap((linha) =>
    linha.split(';').map((r) => r.trim()).filter(Boolean),
  );
  const [livrosPadrao, outros] = await Promise.all([
    referencias.length > 0 ? getLivrosPadrao() : Promise.resolve(null),
    getEstudosPublicados(),
  ]);
  const relacionados = outros.estudos
    .filter(
      (e) =>
        e.id !== estudo.id &&
        ((serie && e.tags?.includes(`serie:${serie.slug}`)) || (estudo.category && e.category === estudo.category)),
    )
    .slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/estudos" className="text-sm font-semibold text-sacred-700 hover:text-gold-600 dark:text-parchment-100 dark:hover:text-gold-400">
        ← Estudos e Reflexões
      </Link>

      <header className="mt-6">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-700 dark:text-gold-400">
          {[estudo.category, formatoDe(estudo)].filter(Boolean).join(' · ')}
        </p>
        <h1 className="font-serif text-4xl font-semibold leading-tight text-sacred-900 dark:text-parchment-50">
          {estudo.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-sacred-600 dark:text-parchment-200">{estudo.summary}</p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          {data && <p className="text-sm text-sacred-400 dark:text-parchment-200">Publicado em {data}</p>}
          <ShareButton title={estudo.title} text={estudo.summary} />
        </div>
        {serie && (
          <p className="mt-5 rounded-lg bg-parchment-100 px-4 py-3 text-sm text-sacred-700 dark:bg-sacred-800 dark:text-parchment-100">
            Faz parte da série{' '}
            <Link href={`/estudos?serie=${serie.slug}`} className="font-semibold underline">
              {serie.titulo}
            </Link>
            , relacionada com a obra de Ellen G. White, escrita a partir de uma perspectiva adventista.
          </p>
        )}
      </header>

      {estudo.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={estudo.coverImageUrl} alt="" className="mt-8 w-full rounded-xl object-cover" />
      )}

      <div className="mt-10">
        <ConteudoEstudo corpo={secoes.corpo} />
      </div>

      {referencias.length > 0 && (
        <Bloco id="referencias" titulo="Referências bíblicas">
          <ul className="flex flex-wrap gap-2">
            {referencias.map((ref) => {
              const href = livrosPadrao ? hrefDaReferencia(ref, livrosPadrao.versao, livrosPadrao.livros) : null;
              return (
                <li key={ref}>
                  {href ? (
                    <Link
                      href={href}
                      className="inline-block rounded-full border border-sacred-200 px-3 py-1 text-sm font-medium text-sacred-700 hover:border-gold-500 hover:text-gold-600 dark:border-sacred-600 dark:text-parchment-100 dark:hover:text-gold-400"
                    >
                      {ref}
                    </Link>
                  ) : (
                    <span className="inline-block rounded-full border border-sacred-100 px-3 py-1 text-sm text-sacred-700 dark:border-sacred-700 dark:text-parchment-100">
                      {ref}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Bloco>
      )}

      {(secoes.fontes.length > 0 || serie) && (
        <Bloco id="fontes" titulo="Fontes de apoio">
          <ul className="list-disc space-y-1 pl-5 text-sm text-sacred-700 dark:text-parchment-100">
            {serie && (
              <li>
                {serie.titulo}, de Ellen G. White (perspectiva adventista). As conclusões são examinadas à luz das
                Escrituras.
              </li>
            )}
            {secoes.fontes.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Bloco>
      )}

      {secoes.creditos.length > 0 && (
        <Bloco id="creditos" titulo="Créditos">
          <ul className="space-y-1 text-sm text-sacred-700 dark:text-parchment-100">
            {secoes.creditos.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Bloco>
      )}

      {secoes.autoria.length > 0 && (
        <Bloco id="autoria" titulo="Autoria e revisão">
          <ul className="space-y-1 text-sm text-sacred-700 dark:text-parchment-100">
            {secoes.autoria.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Bloco>
      )}

      {relacionados.length > 0 && (
        <section aria-labelledby="relacionados" className="mt-14">
          <h2 id="relacionados" className="mb-4 font-serif text-2xl font-semibold text-sacred-900 dark:text-parchment-50">
            Continue a ler
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {relacionados.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/estudos/${r.slug}`}
                  className="block rounded-xl border border-sacred-100 p-4 hover:border-gold-500 dark:border-sacred-700"
                >
                  <span className="font-serif text-lg font-semibold text-sacred-900 dark:text-parchment-50">
                    {r.title}
                  </span>
                  <span className="mt-1 block text-sm text-sacred-600 dark:text-parchment-200">{r.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
