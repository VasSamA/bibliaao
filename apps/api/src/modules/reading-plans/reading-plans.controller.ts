import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReadingPlansService } from './reading-plans.service';
import { UpsertReadingPlanDto } from './dto/upsert-reading-plan.dto';
import { UpsertReadingPlanDayDto } from './dto/upsert-reading-plan-day.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

const EDITORES = [UserRole.EDITOR_CONTEUDO, UserRole.PASTOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR];

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

  @Roles(...EDITORES)
  @Post()
  create(@Body() dto: UpsertReadingPlanDto) {
    return this.plansService.create(dto);
  }

  @Roles(...EDITORES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<UpsertReadingPlanDto>) {
    return this.plansService.update(id, dto);
  }

  @Roles(...EDITORES)
  @Put(':id/dias/:dayNumber')
  upsertDay(
    @Param('id') id: string,
    @Param('dayNumber') dayNumber: string,
    @Body() dto: UpsertReadingPlanDayDto,
  ) {
    return this.plansService.upsertDay(id, Number(dayNumber), dto);
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
