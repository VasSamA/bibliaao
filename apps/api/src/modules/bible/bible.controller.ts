import { Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BibleService } from './bible.service';
import { BibleImportService } from './import/bible-import.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('biblia')
@Controller('biblia')
export class BibleController {
  constructor(
    private readonly bibleService: BibleService,
    private readonly importService: BibleImportService,
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
  @Post('importar/:bibleId')
  triggerImport(@Param('bibleId') bibleId: string) {
    // Executa de forma assíncrona; ver logs do servidor para progresso.
    this.importService.importVersion(bibleId);
    return { message: `Importação da versão ${bibleId} iniciada. Acompanhe os logs do servidor.` };
  }
}
