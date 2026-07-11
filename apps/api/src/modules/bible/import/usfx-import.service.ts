import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Importa uma versão bíblica a partir de um ficheiro USFX (XML) hospedado
 * publicamente — usado para versões de domínio público, evitando depender de
 * APIs de terceiros protegidas por Cloudflare (ver bible-import.service.ts,
 * que falha nesse ponto contra a Midvash).
 *
 * Fonte por omissão: seven1m/open-bibles (github.com/seven1m/open-bibles),
 * ficheiro por-almeida.usfx.xml — tradução de João Ferreira de Almeida,
 * domínio público. Um único fetch (o ficheiro inteiro) em vez de um pedido
 * por capítulo, o que também evita o problema de rate limiting/resiliência
 * que motivou o import por livro na Midvash.
 */
type BookMeta = {
  id: string;
  order: number;
  testament: 'AT' | 'NT';
  slug: string;
  abbreviation: string;
};

const BOOKS: BookMeta[] = [
  { id: 'GEN', order: 1, testament: 'AT', slug: 'genesis', abbreviation: 'Gn' },
  { id: 'EXO', order: 2, testament: 'AT', slug: 'exodo', abbreviation: 'Êx' },
  { id: 'LEV', order: 3, testament: 'AT', slug: 'levitico', abbreviation: 'Lv' },
  { id: 'NUM', order: 4, testament: 'AT', slug: 'numeros', abbreviation: 'Nm' },
  { id: 'DEU', order: 5, testament: 'AT', slug: 'deuteronomio', abbreviation: 'Dt' },
  { id: 'JOS', order: 6, testament: 'AT', slug: 'josue', abbreviation: 'Js' },
  { id: 'JDG', order: 7, testament: 'AT', slug: 'juizes', abbreviation: 'Jz' },
  { id: 'RUT', order: 8, testament: 'AT', slug: 'rute', abbreviation: 'Rt' },
  { id: '1SA', order: 9, testament: 'AT', slug: '1samuel', abbreviation: '1Sm' },
  { id: '2SA', order: 10, testament: 'AT', slug: '2samuel', abbreviation: '2Sm' },
  { id: '1KI', order: 11, testament: 'AT', slug: '1reis', abbreviation: '1Rs' },
  { id: '2KI', order: 12, testament: 'AT', slug: '2reis', abbreviation: '2Rs' },
  { id: '1CH', order: 13, testament: 'AT', slug: '1cronicas', abbreviation: '1Cr' },
  { id: '2CH', order: 14, testament: 'AT', slug: '2cronicas', abbreviation: '2Cr' },
  { id: 'EZR', order: 15, testament: 'AT', slug: 'esdras', abbreviation: 'Ed' },
  { id: 'NEH', order: 16, testament: 'AT', slug: 'neemias', abbreviation: 'Ne' },
  { id: 'EST', order: 17, testament: 'AT', slug: 'ester', abbreviation: 'Et' },
  { id: 'JOB', order: 18, testament: 'AT', slug: 'jo', abbreviation: 'Jó' },
  { id: 'PSA', order: 19, testament: 'AT', slug: 'salmos', abbreviation: 'Sl' },
  { id: 'PRO', order: 20, testament: 'AT', slug: 'proverbios', abbreviation: 'Pv' },
  { id: 'ECC', order: 21, testament: 'AT', slug: 'eclesiastes', abbreviation: 'Ec' },
  { id: 'SNG', order: 22, testament: 'AT', slug: 'canticos', abbreviation: 'Ct' },
  { id: 'ISA', order: 23, testament: 'AT', slug: 'isaias', abbreviation: 'Is' },
  { id: 'JER', order: 24, testament: 'AT', slug: 'jeremias', abbreviation: 'Jr' },
  { id: 'LAM', order: 25, testament: 'AT', slug: 'lamentacoes', abbreviation: 'Lm' },
  { id: 'EZK', order: 26, testament: 'AT', slug: 'ezequiel', abbreviation: 'Ez' },
  { id: 'DAN', order: 27, testament: 'AT', slug: 'daniel', abbreviation: 'Dn' },
  { id: 'HOS', order: 28, testament: 'AT', slug: 'oseias', abbreviation: 'Os' },
  { id: 'JOL', order: 29, testament: 'AT', slug: 'joel', abbreviation: 'Jl' },
  { id: 'AMO', order: 30, testament: 'AT', slug: 'amos', abbreviation: 'Am' },
  { id: 'OBA', order: 31, testament: 'AT', slug: 'obadias', abbreviation: 'Ob' },
  { id: 'JON', order: 32, testament: 'AT', slug: 'jonas', abbreviation: 'Jn' },
  { id: 'MIC', order: 33, testament: 'AT', slug: 'miqueias', abbreviation: 'Mq' },
  { id: 'NAM', order: 34, testament: 'AT', slug: 'naum', abbreviation: 'Na' },
  { id: 'HAB', order: 35, testament: 'AT', slug: 'habacuque', abbreviation: 'Hc' },
  { id: 'ZEP', order: 36, testament: 'AT', slug: 'sofonias', abbreviation: 'Sf' },
  { id: 'HAG', order: 37, testament: 'AT', slug: 'ageu', abbreviation: 'Ag' },
  { id: 'ZEC', order: 38, testament: 'AT', slug: 'zacarias', abbreviation: 'Zc' },
  { id: 'MAL', order: 39, testament: 'AT', slug: 'malaquias', abbreviation: 'Ml' },
  { id: 'MAT', order: 40, testament: 'NT', slug: 'mateus', abbreviation: 'Mt' },
  { id: 'MRK', order: 41, testament: 'NT', slug: 'marcos', abbreviation: 'Mc' },
  { id: 'LUK', order: 42, testament: 'NT', slug: 'lucas', abbreviation: 'Lc' },
  { id: 'JHN', order: 43, testament: 'NT', slug: 'joao', abbreviation: 'Jo' },
  { id: 'ACT', order: 44, testament: 'NT', slug: 'atos', abbreviation: 'At' },
  { id: 'ROM', order: 45, testament: 'NT', slug: 'romanos', abbreviation: 'Rm' },
  { id: '1CO', order: 46, testament: 'NT', slug: '1corintios', abbreviation: '1Co' },
  { id: '2CO', order: 47, testament: 'NT', slug: '2corintios', abbreviation: '2Co' },
  { id: 'GAL', order: 48, testament: 'NT', slug: 'galatas', abbreviation: 'Gl' },
  { id: 'EPH', order: 49, testament: 'NT', slug: 'efesios', abbreviation: 'Ef' },
  { id: 'PHP', order: 50, testament: 'NT', slug: 'filipenses', abbreviation: 'Fp' },
  { id: 'COL', order: 51, testament: 'NT', slug: 'colossenses', abbreviation: 'Cl' },
  { id: '1TH', order: 52, testament: 'NT', slug: '1tessalonicenses', abbreviation: '1Ts' },
  { id: '2TH', order: 53, testament: 'NT', slug: '2tessalonicenses', abbreviation: '2Ts' },
  { id: '1TI', order: 54, testament: 'NT', slug: '1timoteo', abbreviation: '1Tm' },
  { id: '2TI', order: 55, testament: 'NT', slug: '2timoteo', abbreviation: '2Tm' },
  { id: 'TIT', order: 56, testament: 'NT', slug: 'tito', abbreviation: 'Tt' },
  { id: 'PHM', order: 57, testament: 'NT', slug: 'filemom', abbreviation: 'Fm' },
  { id: 'HEB', order: 58, testament: 'NT', slug: 'hebreus', abbreviation: 'Hb' },
  { id: 'JAS', order: 59, testament: 'NT', slug: 'tiago', abbreviation: 'Tg' },
  { id: '1PE', order: 60, testament: 'NT', slug: '1pedro', abbreviation: '1Pe' },
  { id: '2PE', order: 61, testament: 'NT', slug: '2pedro', abbreviation: '2Pe' },
  { id: '1JN', order: 62, testament: 'NT', slug: '1joao', abbreviation: '1Jo' },
  { id: '2JN', order: 63, testament: 'NT', slug: '2joao', abbreviation: '2Jo' },
  { id: '3JN', order: 64, testament: 'NT', slug: '3joao', abbreviation: '3Jo' },
  { id: 'JUD', order: 65, testament: 'NT', slug: 'judas', abbreviation: 'Jd' },
  { id: 'REV', order: 66, testament: 'NT', slug: 'apocalipse', abbreviation: 'Ap' },
];

type ParsedBook = {
  name: string;
  chapters: Map<number, Map<number, string>>;
};

@Injectable()
export class UsfxImportService {
  private readonly logger = new Logger(UsfxImportService.name);

  constructor(private readonly prisma: PrismaClient) {}

  private parse(xml: string): Map<string, ParsedBook> {
    const books = new Map<string, ParsedBook>();
    const blocks = xml.split(/(?=<book id=")/).filter((b) => b.startsWith('<book id='));

    for (const block of blocks) {
      const idMatch = block.match(/<book id="([A-Z0-9]+)">/);
      const nameMatch = block.match(/<h>([^<]*)<\/h>/);
      if (!idMatch || !nameMatch) continue;

      const chapters = new Map<number, Map<number, string>>();
      const body = block.slice(block.indexOf('</h>') + 4);
      const chapterParts = body.split(/<c id="(\d+)"\/>/);

      for (let i = 1; i < chapterParts.length; i += 2) {
        const chapterNumber = parseInt(chapterParts[i], 10);
        const content = chapterParts[i + 1] ?? '';
        const verses = new Map<number, string>();
        const verseRegex = /<v id="(\d+)"\/>([\s\S]*?)<ve\/>/g;
        let m: RegExpExecArray | null;
        while ((m = verseRegex.exec(content))) {
          const text = m[2].replace(/\s+/g, ' ').trim();
          if (text) verses.set(parseInt(m[1], 10), text);
        }
        chapters.set(chapterNumber, verses);
      }

      books.set(idMatch[1], { name: nameMatch[1].trim(), chapters });
    }

    return books;
  }

  async importFromUrl(
    sourceUrl: string,
    version: { code: string; name: string; description: string; language?: string },
  ) {
    this.logger.log(`A importar "${version.code}" de ${sourceUrl}...`);

    const res = await fetch(sourceUrl);
    if (!res.ok) {
      throw new Error(`Falha ao obter ${sourceUrl}: HTTP ${res.status}`);
    }
    const parsed = this.parse(await res.text());

    const versionRecord = await this.prisma.bibleVersion.upsert({
      where: { code: version.code },
      update: { name: version.name, description: version.description, source: 'usfx' },
      create: {
        code: version.code,
        name: version.name,
        language: version.language ?? 'pt',
        description: version.description,
        source: 'usfx',
      },
    });

    for (const meta of BOOKS) {
      const data = parsed.get(meta.id);
      if (!data) {
        this.logger.warn(`Livro "${meta.id}" não encontrado no ficheiro de origem.`);
        continue;
      }

      try {
        const bookRecord = await this.prisma.bibleBook.upsert({
          where: { versionId_slug: { versionId: versionRecord.id, slug: meta.slug } },
          update: { name: data.name, abbreviation: meta.abbreviation, chaptersCount: data.chapters.size },
          create: {
            versionId: versionRecord.id,
            externalId: meta.id,
            slug: meta.slug,
            name: data.name,
            abbreviation: meta.abbreviation,
            testament: meta.testament,
            order: meta.order,
            chaptersCount: data.chapters.size,
          },
        });

        for (const [chapterNumber, verses] of data.chapters) {
          const chapterRecord = await this.prisma.bibleChapter.upsert({
            where: { bookId_number: { bookId: bookRecord.id, number: chapterNumber } },
            update: { versesCount: verses.size },
            create: { bookId: bookRecord.id, number: chapterNumber, versesCount: verses.size },
          });

          for (const [verseNumber, text] of verses) {
            await this.prisma.bibleVerse.upsert({
              where: { chapterId_number: { chapterId: chapterRecord.id, number: verseNumber } },
              update: { text },
              create: {
                chapterId: chapterRecord.id,
                number: verseNumber,
                text,
                reference: `${data.name} ${chapterNumber}:${verseNumber}`,
              },
            });
          }
        }

        this.logger.log(`  ${data.name}: ${data.chapters.size} capítulo(s) importado(s).`);
      } catch (err) {
        this.logger.warn(`Falha ao importar o livro "${data.name}": ${(err as Error).message}`);
      }
    }

    this.logger.log(`Versão "${version.name}" importada com sucesso.`);
  }
}
