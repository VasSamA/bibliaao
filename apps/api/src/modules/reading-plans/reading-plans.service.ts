import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentStatus } from '@prisma/client';

@Injectable()
export class ReadingPlansService {
  constructor(private readonly prisma: PrismaService) {}

  findPublished() {
    return this.prisma.readingPlan.findMany({ where: { status: ContentStatus.PUBLICADO } });
  }

  async findBySlug(slug: string) {
    const plan = await this.prisma.readingPlan.findUnique({
      where: { slug },
      include: { days: { orderBy: { dayNumber: 'asc' } } },
    });
    if (!plan) throw new NotFoundException('Plano de leitura não encontrado.');
    return plan;
  }

  async start(userId: string, planId: string) {
    return this.prisma.readingPlanProgress.upsert({
      where: { userId_planId: { userId, planId } },
      update: { lastActivityAt: new Date() },
      create: { userId, planId },
    });
  }

  async advance(userId: string, planId: string) {
    const progress = await this.prisma.readingPlanProgress.findUnique({
      where: { userId_planId: { userId, planId } },
    });
    if (!progress) throw new NotFoundException('Progresso não encontrado. Inicie o plano primeiro.');

    const plan = await this.prisma.readingPlan.findUnique({ where: { id: planId } });
    const nextDay = progress.currentDay + 1;
    const completed = plan ? nextDay > plan.durationDays : false;

    return this.prisma.readingPlanProgress.update({
      where: { userId_planId: { userId, planId } },
      data: {
        currentDay: completed ? progress.currentDay : nextDay,
        completedAt: completed ? new Date() : undefined,
        lastActivityAt: new Date(),
      },
    });
  }

  myProgress(userId: string) {
    return this.prisma.readingPlanProgress.findMany({ where: { userId }, include: { plan: true } });
  }
}
