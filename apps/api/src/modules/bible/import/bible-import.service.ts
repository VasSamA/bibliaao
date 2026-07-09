import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Serviço de importação do texto bíblico a partir da API.Bible
 * (https://scripture.api.bible/). Requer API_BIBLE_KEY no ambiente.
 *
 * Fluxo:
 *  1. Para cada versão listada em API_BIBLE_VERSION_IDS, busca metadados
 *     e cria/atualiza um registo em `bible_versions`.
 *  2. Busca a lista de livros (`/bibles/{bibleId}/books`) e grava em
 *     `bible_books`, mapeando testamento e ordem.
 *  3. Para cada livro, busca capítulos (`/bibles/{bibleId}/books/{bookId}/chapters`)
 *     e grava em `bible_chapters`.
 *  4. Para cada capítulo, busca o conteúdo em texto e versículos
 *     (`/bibles/{bibleId}/chapters/{chapterId}?content-type=text`) e faz
 *     parsing para popular `bible_verses`.
 *
 * A API.Bible tem limites de taxa — este serviço aplica um atraso entre
 * pedidos e é seguro para re-execução (idempotente via upsert).
 */
@Injectable()
export class BibleImportService {
  private readonly logger = new Logger(BibleImportService.name);
  private readonly baseUrl = process.env.API_BIBLE_BASE_URL ?? 'https://api.scripture.api.bible/v1';
  private readonly apiKey = process.env.API_BIBLE_KEY ?? '';

  constructor(private readonly prisma: PrismaClient) {}

  private async request<T>(path: string): Promise<T> {
    if (!this.apiKey) {
      throw new Error(
        'API_BIBLE_KEY não configurada. Obtenha uma chave em https://scripture.api.bible/ e defina no .env',
      );
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'api-key': this.apiKey },
    });
    if (!res.ok) {
      throw new Error(`API.Bible erro ${res.status} em ${path}: ${await res.text()}`);
    }
    const json = (await res.json()) as { data: T };
    return json.data;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async importVersion(bibleId: string) {
    this.logger.log(`A importar versão ${bibleId}...`);

    const meta = await this.request<{
      id: string;
      abbreviation: string;
      name: string;
      language: { id: string; name: string };
      description?: string;
    }>(`/bibles/${bibleId}`);

    const version = await this.prisma.bibleVersion.upsert({
      where: { code: meta.abbreviation || meta.id },
      update: { name: meta.name, externalId: meta.id, source: 'api.bible' },
      create: {
        code: meta.abbreviation || meta.id,
        name: meta.name,
        language: meta.language?.id ?? 'pt',
        description: meta.description,
        externalId: meta.id,
        source: 'api.bible',
      },
    });

    const books = await this.request<
      Array<{ id: string; bibleId: string; abbreviation: string; name: string; nameLong?: string }>
    >(`/bibles/${bibleId}/books`);

    let order = 1;
    for (const b of books) {
      const testament = order <= 39 ? 'AT' : 'NT'; // aproximação; ajustar por cânone se necessário
      const slug = this.slugify(b.name);

      const book = await this.prisma.bibleBook.upsert({
        where: { versionId_slug: { versionId: version.id, slug } },
        update: { name: b.name, abbreviation: b.abbreviation, externalId: b.id },
        create: {
          versionId: version.id,
          externalId: b.id,
          slug,
          name: b.name,
          abbreviation: b.abbreviation,
          testament,
          order: order++,
        },
      });

      await this.importChapters(bibleId, b.id, book.id);
      await this.sleep(250); // respeitar rate limit
    }

    this.logger.log(`Versão ${meta.name} importada com sucesso.`);
  }

  private async importChapters(bibleId: string, apiBookId: string, bookId: string) {
    const chapters = await this.request<Array<{ id: string; number: string }>>(
      `/bibles/${bibleId}/books/${apiBookId}/chapters`,
    );

    let chaptersCount = 0;
    for (const c of chapters) {
      if (c.number === 'intro') continue; // ignorar introduções
      const number = parseInt(c.number, 10);
      if (Number.isNaN(number)) continue;

      const chapter = await this.prisma.bibleChapter.upsert({
        where: { bookId_number: { bookId, number } },
        update: {},
        create: { bookId, number },
      });

      await this.importVerses(bibleId, c.id, chapter.id);
      chaptersCount++;
      await this.sleep(150);
    }

    await this.prisma.bibleBook.update({
      where: { id: bookId },
      data: { chaptersCount },
    });
  }

  private async importVerses(bibleId: string, apiChapterId: string, chapterId: string) {
    const chapterContent = await this.request<{ content: string; reference: string }>(
      `/bibles/${bibleId}/chapters/${apiChapterId}?content-type=text&include-verse-numbers=true`,
    );

    // A API devolve o texto do capítulo com marcadores [n] por versículo.
    const verseMatches = [...chapterContent.content.matchAll(/\[(\d+)\]\s*([^[]+)/g)];

    let versesCount = 0;
    for (const match of verseMatches) {
      const number = parseInt(match[1], 10);
      const text = match[2].trim();
      if (!text) continue;

      await this.prisma.bibleVerse.upsert({
        where: { chapterId_number: { chapterId, number } },
        update: { text },
        create: {
          chapterId,
          number,
          text,
          reference: `${chapterContent.reference}:${number}`,
        },
      });
      versesCount++;
    }

    await this.prisma.bibleChapter.update({
      where: { id: chapterId },
      data: { versesCount },
    });
  }

  private slugify(name: string) {
    return name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
