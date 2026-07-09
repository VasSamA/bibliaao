import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Pesquisa unificada sobre versículos, estudos, artigos, recursos e igrejas.
 * Implementação atual: PostgreSQL (ILIKE / full text). Para produção a
 * grande escala, apontar para Meilisearch/Typesense (ver infra/docker-compose.yml
 * e variável MEILISEARCH_HOST), mantendo esta interface.
 */
@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async searchAll(query: string) {
    const q = { contains: query, mode: 'insensitive' as const };

    const [verses, studies, articles, resources, churches] = await Promise.all([
      this.prisma.bibleVerse.findMany({ where: { text: q }, take: 10 }),
      this.prisma.study.findMany({ where: { status: 'PUBLICADO', OR: [{ title: q }, { summary: q }] }, take: 10 }),
      this.prisma.article.findMany({ where: { status: 'PUBLICADO', OR: [{ title: q }, { excerpt: q }] }, take: 10 }),
      this.prisma.resource.findMany({ where: { status: 'PUBLICADO', title: q }, take: 10 }),
      this.prisma.church.findMany({ where: { status: 'APROVADA', name: q }, take: 10 }),
    ]);

    return { verses, studies, articles, resources, churches };
  }
}
