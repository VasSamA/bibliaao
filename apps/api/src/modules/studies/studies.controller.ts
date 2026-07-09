import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StudiesService } from './studies.service';
import { UpsertStudyDto } from './dto/upsert-study.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

const EDITORES = [UserRole.EDITOR_CONTEUDO, UserRole.PASTOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR];

@ApiTags('estudos')
@Controller('estudos')
export class StudiesController {
  constructor(private readonly studiesService: StudiesService) {}

  @Public()
  @Get()
  findAll(@Query('page') page?: string, @Query('category') category?: string) {
    return this.studiesService.findPublished({ page: page ? Number(page) : undefined, category });
  }

  @Roles(...EDITORES)
  @Get('pendentes')
  findPending() {
    return this.studiesService.findPendingApproval();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.studiesService.findBySlug(slug);
  }

  @Roles(...EDITORES)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: UpsertStudyDto) {
    return this.studiesService.create(user.id, dto);
  }

  @Roles(...EDITORES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<UpsertStudyDto>) {
    return this.studiesService.update(id, dto);
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Patch(':id/publicar')
  publish(@Param('id') id: string) {
    return this.studiesService.publish(id);
  }

  @Roles(UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studiesService.remove(id);
  }
}
