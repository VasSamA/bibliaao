import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentStatus } from '@prisma/client';
import { UpsertCourseDto } from './dto/upsert-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.course.findMany({ where: { status: ContentStatus.PUBLICADO }, orderBy: { createdAt: 'asc' } });
  }

  async findBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: { lessons: { orderBy: { order: 'asc' } } },
    });
    if (!course) throw new NotFoundException('Curso não encontrado.');
    return course;
  }

  create(dto: UpsertCourseDto) {
    return this.prisma.course.create({ data: dto as any });
  }

  addLesson(courseId: string, data: { title: string; order: number; videoUrl?: string; content?: string; durationMinutes?: number }) {
    return this.prisma.courseLesson.create({ data: { ...data, courseId } });
  }

  publish(id: string) {
    return this.prisma.course.update({ where: { id }, data: { status: ContentStatus.PUBLICADO } });
  }
}
