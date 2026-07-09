import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentStatus } from '@prisma/client';
import { UpsertArticleDto } from './dto/upsert-article.dto';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished(page = 1, pageSize = 12, category?: string) {
    return this.prisma.article.findMany({
      where: { status: ContentStatus.PUBLICADO, category },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({ where: { slug } });
    if (!article) throw new NotFoundException('Artigo não encontrado.');
    return article;
  }

  create(authorId: string, dto: UpsertArticleDto) {
    return this.prisma.article.create({ data: { ...dto, authorId } as any });
  }

  update(id: string, dto: Partial<UpsertArticleDto>) {
    return this.prisma.article.update({ where: { id }, data: dto as any });
  }

  publish(id: string) {
    return this.prisma.article.update({ where: { id }, data: { status: ContentStatus.PUBLICADO, publishedAt: new Date() } });
  }
}
