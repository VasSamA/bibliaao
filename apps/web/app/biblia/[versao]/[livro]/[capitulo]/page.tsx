import { VerseReader, type Verse } from '../../../../../components/VerseReader';

type Params = { versao: string; livro: string; capitulo: string };

// Capítulo de exemplo (João 3) usado como fallback quando a API não está disponível.
// Em produção, isto é substituído por: await api.get(`/biblia/${versao}/${livro}/${capitulo}`)
const CHAPTER_FALLBACK: Record<string, { bookName: string; verses: Verse[] }> = {
  'joao-3': {
    bookName: 'João',
    verses: [
      { id: '1', number: 14, reference: 'João 3:14', text: 'E, como Moisés levantou a serpente no deserto, assim importa que o Filho do homem seja levantado,' },
      { id: '2', number: 15, reference: 'João 3:15', text: 'para que todo aquele que nele crê não pereça, mas tenha a vida eterna.' },
      { id: '3', number: 16, reference: 'João 3:16', text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigénito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.' },
      { id: '4', number: 17, reference: 'João 3:17', text: 'Porque Deus enviou o seu Filho ao mundo não para que condenasse o mundo, mas para que o mundo fosse salvo por ele.' },
    ],
  },
};

async function getChapter(versao: string, livro: string, capitulo: string) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:4000/api/v1';
  try {
    const res = await fetch(`${apiUrl}/biblia/${versao}/${livro}/${capitulo}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return {
        bookName: data.book.name as string,
        verses: data.chapter.verses.map((v: any) => ({ id: v.id, number: v.number, text: v.text, reference: v.reference })) as Verse[],
      };
    }
  } catch {
    // API indisponível — usar conteúdo de exemplo abaixo.
  }
  return CHAPTER_FALLBACK[`${livro}-${capitulo}`] ?? CHAPTER_FALLBACK['joao-3'];
}

export default async function ChapterPage({ params }: { params: Params }) {
  const { bookName, verses } = await getChapter(params.versao, params.livro, params.capitulo);
  return <VerseReader verses={verses} bookName={bookName} chapterNumber={Number(params.capitulo)} />;
}
