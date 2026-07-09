import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentStatus, ResourceType } from '@prisma/client';
import { UpsertResourceDto } from './dto/upsert-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  findApproved(params: { type?: ResourceType; audience?: string; page?: number; pageSize?: number }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    return this.prisma.resource.findMany({
      where: { status: ContentStatus.PUBLICADO, type: params.type, audience: params.audience },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
  }

  findPendingApproval() {
    return this.prisma.resource.findMany({ where: { status: ContentStatus.PENDENTE_APROVACAO } });
  }

  create(dto: UpsertResourceDto) {
    return this.prisma.resource.create({ data: dto as any });
  }

  async approve(id: string) {
    await this.ensureExists(id);
    return this.prisma.resource.update({ where: { id }, data: { status: ContentStatus.PUBLICADO } });
  }

  async reject(id: string) {
    await this.ensureExists(id);
    return this.prisma.resource.update({ where: { id }, data: { status: ContentStatus.REJEITADO } });
  }

  async registerDownload(id: string) {
    await this.ensureExists(id);
    return this.prisma.resource.update({ where: { id }, data: { downloadCount: { increment: 1 } } });
  }

  private async ensureExists(id: string) {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource) throw new NotFoundException('Recurso não encontrado.');
  }
}
