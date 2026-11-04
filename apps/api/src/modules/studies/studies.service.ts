import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentStatus } from '@prisma/client';
import { UpsertStudyDto } from './dto/upsert-study.dto';

@Injectable()
export class StudiesService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished(params: { page?: number; pageSize?: number; category?: string; tag?: string }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 12;
    return this.prisma.study.findMany({
      where: {
        status: ContentStatus.PUBLICADO,
        category: params.category,
        tags: params.tag ? { has: params.tag } : undefined,
      },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  // Rota pública: rascunhos, estudos em revisão e arquivados respondem 404,
  // tal como se não existissem, para não vazarem por endereço directo.
  async findBySlug(slug: string) {
    const study = await this.prisma.study.findFirst({
      where: { slug, status: ContentStatus.PUBLICADO },
      include: { author: { select: { name: true } } },
    });
    if (!study) throw new NotFoundException('Estudo não encontrado.');
    return study;
  }

  create(authorId: string, dto: UpsertStudyDto) {
    return this.prisma.study.create({ data: { ...dto, authorId } as any });
  }

  async update(id: string, dto: Partial<UpsertStudyDto>) {
    await this.ensureExists(id);
    return this.prisma.study.update({ where: { id }, data: dto as any });
  }

  async publish(id: string) {
    await this.ensureExists(id);
    return this.prisma.study.update({
      where: { id },
      data: { status: ContentStatus.PUBLICADO, publishedAt: new Date() },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.study.delete({ where: { id } });
  }

  findPendingApproval() {
    return this.prisma.study.findMany({ where: { status: ContentStatus.PENDENTE_APROVACAO } });
  }

  private async ensureExists(id: string) {
    const study = await this.prisma.study.findUnique({ where: { id } });
    if (!study) throw new NotFoundException('Estudo não encontrado.');
  }
}
