import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DevotionalsService } from './devotionals.service';
import { UpsertDevotionalDto } from './dto/upsert-devotional.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

const EDITORES = [UserRole.EDITOR_CONTEUDO, UserRole.PASTOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR];

@ApiTags('devocionais')
@Controller('devocionais')
export class DevotionalsController {
  constructor(private readonly devotionalsService: DevotionalsService) {}

  @Public()
  @Get('hoje')
  getToday() {
    return this.devotionalsService.getToday();
  }

  @Public()
  @Get()
  findHistory(@Query('page') page?: string) {
    return this.devotionalsService.findHistory(page ? Number(page) : undefined);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.devotionalsService.findBySlug(slug);
  }

  @Roles(...EDITORES)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: UpsertDevotionalDto) {
    return this.devotionalsService.create(user.id, dto);
  }

  @Roles(...EDITORES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<UpsertDevotionalDto>) {
    return this.devotionalsService.update(id, dto);
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Patch(':id/publicar')
  publish(@Param('id') id: string) {
    return this.devotionalsService.publish(id);
  }
}
