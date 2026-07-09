import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('comentarios')
@Controller('comentarios')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @Get()
  findFor(@Query('studyId') studyId?: string, @Query('articleId') articleId?: string, @Query('devotionalId') devotionalId?: string) {
    return this.commentsService.findApprovedFor({ studyId, articleId, devotionalId });
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Get('pendentes')
  findPending() {
    return this.commentsService.findPending();
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateCommentDto) {
    return this.commentsService.create(user.id, dto);
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Patch(':id/aprovar')
  approve(@Param('id') id: string) {
    return this.commentsService.approve(id);
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Patch(':id/rejeitar')
  reject(@Param('id') id: string) {
    return this.commentsService.reject(id);
  }
}
