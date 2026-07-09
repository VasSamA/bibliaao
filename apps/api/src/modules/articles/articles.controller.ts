import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { UpsertArticleDto } from './dto/upsert-article.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

const EDITORES = [UserRole.EDITOR_CONTEUDO, UserRole.PASTOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR];

@ApiTags('blog')
@Controller('blog')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Public()
  @Get()
  findAll(@Query('page') page?: string, @Query('category') category?: string) {
    return this.articlesService.findPublished(page ? Number(page) : undefined, undefined, category);
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  @Roles(...EDITORES)
  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: UpsertArticleDto) {
    return this.articlesService.create(user.id, dto);
  }

  @Roles(...EDITORES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<UpsertArticleDto>) {
    return this.articlesService.update(id, dto);
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Patch(':id/publicar')
  publish(@Param('id') id: string) {
    return this.articlesService.publish(id);
  }
}
