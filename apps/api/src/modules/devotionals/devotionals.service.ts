import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentStatus } from '@prisma/client';
import { UpsertDevotionalDto } from './dto/upsert-devotional.dto';

@Injectable()
export class DevotionalsService {
  constructor(private readonly prisma: PrismaService) {}

  getToday() {
    const today = new Date(new Date().toDateString());
    return this.prisma.devotional.findFirst({
      where: { date: today, status: ContentStatus.PUBLICADO },
    });
  }

  findHistory(page = 1, pageSize = 30) {
    return this.prisma.devotional.findMany({
      where: { status: ContentStatus.PUBLICADO },
      orderBy: { date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async findBySlug(slug: string) {
    const devotional = await this.prisma.devotional.findUnique({ where: { slug } });
    if (!devotional) throw new NotFoundException('Devocional não encontrado.');
    return devotional;
  }

  create(authorId: string, dto: UpsertDevotionalDto) {
    return this.prisma.devotional.create({ data: { ...dto, date: new Date(dto.date), authorId } as any });
  }

  update(id: string, dto: Partial<UpsertDevotionalDto>) {
    return this.prisma.devotional.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined } as any,
    });
  }

  publish(id: string) {
    return this.prisma.devotional.update({ where: { id }, data: { status: ContentStatus.PUBLICADO } });
  }
}
