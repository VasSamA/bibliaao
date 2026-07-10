import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

type MidvashBook = {
  id: number;
  name: Record<string, string>;
  slug: Record<string, string>;
  abbrev: Record<string, string>;
  chapters: number;
  testament: 'old' | 'new';
  category: string;
};

type MidvashVersion = {
  slug: string;
  name: string;
  shortName: string;
  language: string;
  hasOldTestament: boolean;
  hasNewTestament: boolean;
  totalBooks: number;
  totalChapters: number;
};

type MidvashChapter = {
  version: string;
  book: string;
  bookName: string;
  chapter: number;
  verses: string[];
};

/**
 * Serviço de importação do texto bíblico a partir da API pública da Midvash
 * (https://api.midvash.com/) — gratuita, sem chave de API e sem registo,
 * com 86 versões em 32 idiomas (incluindo várias em português: ARA, ACF,
 * NVI, NAA, entre outras).
 *
 * Fluxo:
 *  1. Busca os metadados da versão (`/v1/versions/{slug}`) e cria/atualiza
 *     o registo em `bible_versions`.
 *  2. Busca a lista canónica de livros (`/v1/books`) — inclui testamento,
 *     ordem (id) e slug em várias línguas (usamos o slug pt-br, que também
 *     é aceite como parâmetro de rota pela própria API).
 *  3. Para cada livro compatível com a versão (Antigo/Novo Testamento),
 *     grava `bible_books` e, para cada capítulo (`/v1/{versao}/{livro}/{n}`),
 *     grava `bible_chapters` e os respetivos `bible_verses`.
 *
 * Idempotente (upsert) — seguro para re-executar.
 */
@Injectable()
export class BibleImportService {
  private readonly logger = new Logger(BibleImportService.name);
  private readonly baseUrl = process.env.MIDVASH_API_URL ?? 'https://api.midvash.com/v1';

  constructor(private readonly prisma: PrismaClient) {}

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`);
    if (!res.ok) {
      throw new Error(`Midvash API erro ${res.status} em ${path}: ${await res.text()}`);
    }
    const json = (await res.json()) as { data: T };
    return json.data;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async importVersion(versionSlug: string) {
    this.logger.log(`A importar versão "${versionSlug}" da Midvash API...`);

    const meta = await this.request<MidvashVersion>(`/versions/${versionSlug}`);

    const version = await this.prisma.bibleVersion.upsert({
      where: { code: meta.shortName || meta.slug.toUpperCase() },
      update: { name: meta.name, source: 'midvash' },
      create: {
        code: meta.shortName || meta.slug.toUpperCase(),
        name: meta.name,
        language: meta.language,
        externalId: meta.slug,
        source: 'midvash',
      },
    });

    const allBooks = await this.request<MidvashBook[]>('/books');
    const relevantBooks = allBooks
      .filter((b) => (b.testament === 'old' ? meta.hasOldTestament : meta.hasNewTestament))
      .sort((a, b) => a.id - b.id);

    for (const book of relevantBooks) {
      // Todo o processamento de um livro corre protegido: se qualquer coisa falhar
      // (rede, Cloudflare, erro de BD) não deve derrubar o processo Node inteiro —
      // isso é o que estava a acontecer antes (promise rejeitada sem .catch() mata
      // o processo, a Container App reinicia, e a importação perde-se a meio).
      try {
        const slug = book.slug['pt-br'] ?? book.slug.en;
        const name = book.name['pt-br'] ?? book.name.en;
        const abbreviation = book.abbrev['pt-br'] ?? book.abbrev.en;
        const testament = book.testament === 'old' ? 'AT' : 'NT';

        const bookRecord = await this.prisma.bibleBook.upsert({
          where: { versionId_slug: { versionId: version.id, slug } },
          update: { name, abbreviation, chaptersCount: book.chapters },
          create: {
            versionId: version.id,
            externalId: String(book.id),
            slug,
            name,
            abbreviation,
            testament,
            order: book.id,
            chaptersCount: book.chapters,
          },
        });

        for (let chapterNumber = 1; chapterNumber <= book.chapters; chapterNumber++) {
          try {
            await this.importChapter(versionSlug, slug, chapterNumber, bookRecord.id);
          } catch (err) {
            this.logger.warn(`Falha ao importar ${name} ${chapterNumber}: ${(err as Error).message}`);
          }
          await this.sleep(30); // ritmo gentil — a Midvash não exige, mas evita rajadas desnecessárias
        }

        this.logger.log(`  ${name}: ${book.chapters} capítulo(s) importado(s).`);
      } catch (err) {
        this.logger.warn(`Falha ao importar o livro "${book.name.en ?? book.id}": ${(err as Error).message}`);
      }
    }

    this.logger.log(`Versão "${meta.name}" importada com sucesso (${relevantBooks.length} livros).`);
  }

  private async importChapter(versionSlug: string, bookSlug: string, chapterNumber: number, bookId: string) {
    const chapterData = await this.request<MidvashChapter>(`/${versionSlug}/${bookSlug}/${chapterNumber}`);

    const chapter = await this.prisma.bibleChapter.upsert({
      where: { bookId_number: { bookId, number: chapterNumber } },
      update: { versesCount: chapterData.verses.length },
      create: { bookId, number: chapterNumber, versesCount: chapterData.verses.length },
    });

    for (let i = 0; i < chapterData.verses.length; i++) {
      const verseNumber = i + 1;
      const text = chapterData.verses[i];
      if (!text) continue;

      await this.prisma.bibleVerse.upsert({
        where: { chapterId_number: { chapterId: chapter.id, number: verseNumber } },
        update: { text },
        create: {
          chapterId: chapter.id,
          number: verseNumber,
          text,
          reference: `${chapterData.bookName} ${chapterNumber}:${verseNumber}`,
        },
      });
    }
  }
}
