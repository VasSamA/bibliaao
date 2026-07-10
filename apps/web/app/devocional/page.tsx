export const metadata = { title: 'Devocional Diário — Biblia.ao' };

const FALLBACK = {
  title: 'O amor que não pereceu',
  verseReference: 'João 3:16',
  verseText: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigénito...',
  reflection:
    'Este é o versículo mais conhecido das Escrituras — e por boas razões. Ele resume o evangelho numa única frase: o amor de Deus, a dádiva de Cristo, a fé como resposta, e a vida eterna como promessa.',
  prayer: 'Senhor, obrigado pelo teu amor que não desiste de nós. Ajuda-nos a viver como quem recebeu este dom. Amém.',
  application: 'Hoje, partilha este versículo com alguém que precisa de esperança.',
};

async function getToday() {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/devocionais/hoje`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch {
    // usa fallback
  }
  return FALLBACK;
}

export default async function DevocionalPage() {
  const d = await getToday();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="mb-2 text-sm uppercase tracking-widest text-gold-600 dark:text-gold-400">
        Devocional de hoje — {new Date().toLocaleDateString('pt-AO', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <h1 className="font-serif text-3xl font-semibold mb-6">{d.title}</h1>

      <blockquote className="verse-text mb-6 border-l-4 border-gold-500 pl-4 italic text-lg">
        &ldquo;{d.verseText}&rdquo; <span className="not-italic text-sm text-gold-600">— {d.verseReference}</span>
      </blockquote>

      <p className="mb-6 leading-relaxed">{d.reflection}</p>

      {d.application && (
        <div className="mb-6 rounded-xl bg-sacred-50 dark:bg-sacred-800 p-4">
          <p className="text-sm font-medium mb-1">Aplicação prática</p>
          <p className="text-sm">{d.application}</p>
        </div>
      )}

      {d.prayer && (
        <div className="rounded-xl border border-gold-400/50 p-4">
          <p className="text-sm font-medium mb-1">Oração</p>
          <p className="text-sm italic">{d.prayer}</p>
        </div>
      )}
    </div>
  );
}
