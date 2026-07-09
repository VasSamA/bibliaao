export const metadata = { title: 'Comunidade — Biblia.ao' };

export default function ComunidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-4">Comunidade</h1>
      <p className="text-sacred-600 dark:text-parchment-200 mb-8">
        Comenta estudos, devocionais e artigos. Todos os comentários passam por moderação antes de
        serem publicados, para manter um espaço seguro e edificante.
      </p>
      <div className="rounded-2xl border border-sacred-100 dark:border-sacred-700 p-6 text-sm text-sacred-500">
        Entra numa sessão de estudo, devocional ou artigo para participares na conversa.
      </div>
    </div>
  );
}
