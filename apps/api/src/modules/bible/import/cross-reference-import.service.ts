import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import AdmZip from 'adm-zip';

/**
 * Importa as referências cruzadas de openbible.info (dataset "Treasury of
 * Scripture Knowledge" + votação da comunidade, ~345 mil linhas, licença
 * CC-BY: https://www.openbible.info/labs/cross-references/).
 *
 * Guardadas por código canónico de livro (o mesmo esquema usado em
 * `BibleBook.externalId` pelo import USFX) em vez de FK para bible_verses —
 * por isso não estão presas a nenhuma versão: qualquer versão que venha a ser
 * importada com esse esquema de códigos herda automaticamente estas
 * referências, sem reimportar nada.
 */

const SOURCE_URL = 'https://a.openbible.info/data/cross-references.zip';
const ENTRY_NAME = 'cross_references.txt';

// Código openbible.info -> código canónico (mesmo esquema de BibleBook.externalId).
const BOOK_CODE_MAP: Record<string, string> = {
  Gen: 'GEN', Exod: 'EXO', Lev: 'LEV', Num: 'NUM', Deut: 'DEU', Josh: 'JOS',
  Judg: 'JDG', Ruth: 'RUT', '1Sam': '1SA', '2Sam': '2SA', '1Kgs': '1KI', '2Kgs': '2KI',
  '1Chr': '1CH', '2Chr': '2CH', Ezra: 'EZR', Neh: 'NEH', Esth: 'EST', Job: 'JOB',
  Ps: 'PSA', Prov: 'PRO', Eccl: 'ECC', Song: 'SNG', Isa: 'ISA', Jer: 'JER',
  Lam: 'LAM', Ezek: 'EZK', Dan: 'DAN', Hos: 'HOS', Joel: 'JOL', Amos: 'AMO',
  Obad: 'OBA', Jonah: 'JON', Mic: 'MIC', Nah: 'NAM', Hab: 'HAB', Zeph: 'ZEP',
  Hag: 'HAG', Zech: 'ZEC', Mal: 'MAL', Matt: 'MAT', Mark: 'MRK', Luke: 'LUK',
  John: 'JHN', Acts: 'ACT', Rom: 'ROM', '1Cor': '1CO', '2Cor': '2CO', Gal: 'GAL',
  Eph: 'EPH', Phil: 'PHP', Col: 'COL', '1Thess': '1TH', '2Thess': '2TH', '1Tim': '1TI',
  '2Tim': '2TI', Titus: 'TIT', Phlm: 'PHM', Heb: 'HEB', Jas: 'JAS', '1Pet': '1PE',
  '2Pet': '2PE', '1John': '1JN', '2John': '2JN', '3John': '3JN', Jude: 'JUD', Rev: 'REV',
};

type ParsedRef = {
  book: string;
  chapter: number;
  verse: number;
};

function parseRef(ref: string): ParsedRef | null {
  const parts = ref.split('.');
  if (parts.length !== 3) return null;
  const [rawBook, chapter, verse] = parts;
  const book = BOOK_CODE_MAP[rawBook];
  if (!book) return null;
  return { book, chapter: parseInt(chapter, 10), verse: parseInt(verse, 10) };
}

@Injectable()
export class CrossReferenceImportService {
  private readonly logger = new Logger(CrossReferenceImportService.name);

  constructor(private readonly prisma: PrismaClient) {}

  async importFromOpenBible() {
    this.logger.log(`A importar referências cruzadas de ${SOURCE_URL}...`);

    const res = await fetch(SOURCE_URL);
    if (!res.ok) throw new Error(`Falha ao obter ${SOURCE_URL}: HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    const zip = new AdmZip(buffer);
    const entry = zip.getEntry(ENTRY_NAME);
    if (!entry) throw new Error(`Ficheiro "${ENTRY_NAME}" não encontrado no zip.`);
    const text = entry.getData().toString('utf-8');

    const rows: {
      fromBook: string; fromChapter: number; fromVerse: number;
      toBook: string; toChapter: number; toVerse: number;
      toBookEnd: string | null; toChapterEnd: number | null; toVerseEnd: number | null;
      votes: number;
    }[] = [];

    let ignoradas = 0;
    for (const line of text.split('\n')) {
      if (!line || line.startsWith('From Verse') || line.startsWith('#')) continue;
      const [fromRaw, toRaw, votesRaw] = line.split('\t');
      if (!fromRaw || !toRaw) continue;

      const from = parseRef(fromRaw);
      if (!from) { ignoradas++; continue; }

      const [toStartRaw, toEndRaw] = toRaw.split('-');
      const toStart = parseRef(toStartRaw);
      if (!toStart) { ignoradas++; continue; }
      const toEnd = toEndRaw ? parseRef(toEndRaw) : null;

      rows.push({
        fromBook: from.book, fromChapter: from.chapter, fromVerse: from.verse,
        toBook: toStart.book, toChapter: toStart.chapter, toVerse: toStart.verse,
        toBookEnd: toEnd ? toEnd.book : null,
        toChapterEnd: toEnd ? toEnd.chapter : null,
        toVerseEnd: toEnd ? toEnd.verse : null,
        votes: parseInt(votesRaw ?? '0', 10) || 0,
      });
    }

    this.logger.log(`${rows.length} referências interpretadas (${ignoradas} ignoradas). A gravar...`);

    await this.prisma.bibleCrossReference.deleteMany({});

    const CHUNK = 5000;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await this.prisma.bibleCrossReference.createMany({ data: rows.slice(i, i + CHUNK) });
      this.logger.log(`  ${Math.min(i + CHUNK, rows.length)}/${rows.length} gravadas.`);
    }

    this.logger.log(`Referências cruzadas importadas com sucesso (${rows.length} no total).`);
  }
}
