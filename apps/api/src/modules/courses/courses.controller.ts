import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { UpsertCourseDto } from './dto/upsert-course.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

const EDITORES = [UserRole.EDITOR_CONTEUDO, UserRole.PASTOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR];

@ApiTags('academia')
@Controller('academia')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Public()
  @Get()
  findAll() {
    return this.coursesService.findPublished();
  }

  @Public()
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.coursesService.findBySlug(slug);
  }

  @Roles(...EDITORES)
  @Post()
  create(@Body() dto: UpsertCourseDto) {
    return this.coursesService.create(dto);
  }

  @Roles(...EDITORES)
  @Post(':id/licoes')
  addLesson(@Param('id') id: string, @Body() body: { title: string; order: number; videoUrl?: string; content?: string; durationMinutes?: number }) {
    return this.coursesService.addLesson(id, body);
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Patch(':id/publicar')
  publish(@Param('id') id: string) {
    return this.coursesService.publish(id);
  }
}
