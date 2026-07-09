import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  track(eventName: string, userId?: string, properties?: Record<string, unknown>, sessionId?: string) {
    return this.prisma.analyticsEvent.create({
      data: { eventName, userId, properties: properties as any, sessionId },
    });
  }

  async dashboardMetrics() {
    const [
      activeUsers,
      totalUsers,
      bibleReads,
      aiQuestions,
      churches,
      pendingContent,
      downloads,
    ] = await Promise.all([
      this.prisma.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } } }),
      this.prisma.user.count(),
      this.prisma.analyticsEvent.count({ where: { eventName: 'bible.read' } }),
      this.prisma.aiQuestion.count(),
      this.prisma.church.count({ where: { status: 'APROVADA' } }),
      Promise.all([
        this.prisma.study.count({ where: { status: 'PENDENTE_APROVACAO' } }),
        this.prisma.resource.count({ where: { status: 'PENDENTE_APROVACAO' } }),
        this.prisma.church.count({ where: { status: 'PENDENTE' } }),
        this.prisma.comment.count({ where: { status: 'PENDENTE' } }),
      ]).then(([s, r, c, co]) => s + r + c + co),
      this.prisma.resource.aggregate({ _sum: { downloadCount: true } }),
    ]);

    const mostAccessedStudies = await this.prisma.study.findMany({
      where: { status: 'PUBLICADO' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { title: true, slug: true },
    });

    return {
      activeUsers,
      totalUsers,
      bibleReads,
      aiQuestions,
      churches,
      pendingContent,
      totalDownloads: downloads._sum.downloadCount ?? 0,
      mostAccessedStudies,
    };
  }
}
