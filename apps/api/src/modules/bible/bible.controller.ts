import { Controller, Get, Logger, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BibleService } from './bible.service';
import { BibleImportService } from './import/bible-import.service';
import { UsfxImportService } from './import/usfx-import.service';
import { CrossReferenceImportService } from './import/cross-reference-import.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

// Fonte de domínio público (João Ferreira de Almeida) — ver usfx-import.service.ts.
const JFA_USFX_URL =
  'https://raw.githubusercontent.com/seven1m/open-bibles/master/por-almeida.usfx.xml';

@ApiTags('biblia')
@Controller('biblia')
export class BibleController {
  private readonly logger = new Logger(BibleController.name);

  constructor(
    private readonly bibleService: BibleService,
    private readonly importService: BibleImportService,
    private readonly usfxImportService: UsfxImportService,
    private readonly crossReferenceImportService: CrossReferenceImportService,
  ) {}

  @Public()
  @Get('versoes')
  listVersions() {
    return this.bibleService.listVersions();
  }

  @Public()
  @Get(':versao/livros')
  listBooks(@Param('versao') versao: string) {
    return this.bibleService.listBooks(versao);
  }

  @Public()
  @Get(':versao/:livro/:capitulo')
  getChapter(
    @Param('versao') versao: string,
    @Param('livro') livro: string,
    @Param('capitulo', ParseIntPipe) capitulo: number,
  ) {
    return this.bibleService.getChapter(versao, livro, capitulo);
  }

  @Public()
  @Get(':versao/pesquisa')
  search(@Param('versao') versao: string, @Query('q') q: string, @Query('limit') limit?: string) {
    return this.bibleService.searchVerses(versao, q, limit ? Number(limit) : undefined);
  }

  @Public()
  @Get(':versao/:livro/:capitulo/:versiculo/referencias')
  getCrossReferences(
    @Param('versao') versao: string,
    @Param('livro') livro: string,
    @Param('capitulo', ParseIntPipe) capitulo: number,
    @Param('versiculo', ParseIntPipe) versiculo: number,
  ) {
    return this.bibleService.getCrossReferences(versao, livro, capitulo, versiculo);
  }

  @Public()
  @Get('comparar/:livro/:capitulo/:versiculo')
  compare(
    @Param('livro') livro: string,
    @Param('capitulo', ParseIntPipe) capitulo: number,
    @Param('versiculo', ParseIntPipe) versiculo: number,
    @Query('versoes') versoes: string,
  ) {
    return this.bibleService.compareVerse(livro, capitulo, versiculo, (versoes ?? '').split(','));
  }

  @Roles(UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Post('importar/:versao')
  triggerImport(@Param('versao') versao: string) {
    // Executa de forma assíncrona; ver logs do servidor para progresso.
    // .catch() é crítico aqui: sem isto, qualquer erro não tratado dentro da
    // importação (rede, Cloudflare, BD) rejeita esta promise "solta" e o Node
    // crasha o processo inteiro (unhandled rejection), levando a Container App
    // a reiniciar e a perder o progresso a meio.
    this.importService.importVersion(versao).catch((err) => {
      this.logger.error(`Importação da versão "${versao}" falhou: ${(err as Error).message}`);
    });
    return { message: `Importação da versão "${versao}" iniciada. Acompanhe os logs do servidor.` };
  }

  @Roles(UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Post('importar-dominio-publico')
  triggerUsfxImport() {
    this.usfxImportService
      .importFromUrl(JFA_USFX_URL, {
        code: 'JFA',
        name: 'João Ferreira de Almeida (domínio público)',
        description:
          'Tradução de João Ferreira de Almeida, edição de domínio público, via projeto open-bibles.',
      })
      .catch((err) => {
        this.logger.error(`Importação USFX "JFA" falhou: ${(err as Error).message}`);
      });
    return { message: 'Importação "JFA" (domínio público) iniciada. Acompanhe os logs do servidor.' };
  }

  @Roles(UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Post('importar-referencias-cruzadas')
  triggerCrossReferenceImport() {
    this.crossReferenceImportService.importFromOpenBible().catch((err) => {
      this.logger.error(`Importação de referências cruzadas falhou: ${(err as Error).message}`);
    });
    return { message: 'Importação de referências cruzadas iniciada. Acompanhe os logs do servidor.' };
  }
}
