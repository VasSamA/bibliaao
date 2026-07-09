import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(page = 1, pageSize = 50) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { user: { select: { name: true, email: true } } },
    });
  }

  log(action: string, userId?: string, entityType?: string, entityId?: string, metadata?: Record<string, unknown>) {
    return this.prisma.auditLog.create({
      data: { action, userId, entityType, entityId, metadata: metadata as any },
    });
  }
}
