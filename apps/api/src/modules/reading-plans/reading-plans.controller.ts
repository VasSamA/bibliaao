import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReadingPlansService } from './reading-plans.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('planos-leitura')
@Controller('planos-leitura')
export class ReadingPlansController {
  constructor(private readonly plansService: ReadingPlansService) {}

  @Public()
  @Get()
  findAll() {
    return this.plansService.findPublished();
  }

  @Get('meu-progresso')
  myProgress(@CurrentUser() user: { id: string }) {
    return this.plansService.myProgress(user.id);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.plansService.findBySlug(slug);
  }

  @Post(':id/iniciar')
  start(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.plansService.start(user.id, id);
  }

  @Post(':id/avancar')
  advance(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.plansService.advance(user.id, id);
  }
}
