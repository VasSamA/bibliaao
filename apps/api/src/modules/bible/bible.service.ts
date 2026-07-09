import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BibleService {
  constructor(private readonly prisma: PrismaService) {}

  listVersions() {
    return this.prisma.bibleVersion.findMany({ orderBy: { isDefault: 'desc' } });
  }

  async listBooks(versionCode: string) {
    const version = await this.getVersion(versionCode);
    return this.prisma.bibleBook.findMany({
      where: { versionId: version.id },
      orderBy: { order: 'asc' },
    });
  }

  async getChapter(versionCode: string, bookSlug: string, chapterNumber: number) {
    const version = await this.getVersion(versionCode);
    const book = await this.prisma.bibleBook.findUnique({
      where: { versionId_slug: { versionId: version.id, slug: bookSlug } },
    });
    if (!book) throw new NotFoundException('Livro não encontrado.');

    const chapter = await this.prisma.bibleChapter.findUnique({
      where: { bookId_number: { bookId: book.id, number: chapterNumber } },
      include: { verses: { orderBy: { number: 'asc' } } },
    });
    if (!chapter) throw new NotFoundException('Capítulo não encontrado.');

    return { book, chapter };
  }

  /** Pesquisa full-text simples (fallback a Meilisearch feita no módulo `search`). */
  async searchVerses(versionCode: string, query: string, limit = 25) {
    const version = await this.getVersion(versionCode);
    return this.prisma.bibleVerse.findMany({
      where: {
        text: { contains: query, mode: 'insensitive' },
        chapter: { book: { versionId: version.id } },
      },
      take: limit,
      include: { chapter: { include: { book: true } } },
    });
  }

  async compareVerse(bookSlug: string, chapterNumber: number, verseNumber: number, versionCodes: string[]) {
    const results = [];
    for (const code of versionCodes) {
      const version = await this.prisma.bibleVersion.findUnique({ where: { code } });
      if (!version) continue;
      const book = await this.prisma.bibleBook.findUnique({
        where: { versionId_slug: { versionId: version.id, slug: bookSlug } },
      });
      if (!book) continue;
      const chapter = await this.prisma.bibleChapter.findUnique({
        where: { bookId_number: { bookId: book.id, number: chapterNumber } },
      });
      if (!chapter) continue;
      const verse = await this.prisma.bibleVerse.findUnique({
        where: { chapterId_number: { chapterId: chapter.id, number: verseNumber } },
      });
      if (verse) results.push({ version: version.code, text: verse.text });
    }
    return results;
  }

  private async getVersion(code: string) {
    const version = await this.prisma.bibleVersion.findUnique({ where: { code } });
    if (!version) throw new NotFoundException(`Versão bíblica "${code}" não encontrada.`);
    return version;
  }
}
