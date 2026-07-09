import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChurchStatus } from '@prisma/client';
import { CreateChurchDto } from './dto/create-church.dto';

@Injectable()
export class ChurchesService {
  constructor(private readonly prisma: PrismaService) {}

  findApproved(params: { province?: string; city?: string }) {
    return this.prisma.church.findMany({
      where: { status: ChurchStatus.APROVADA, province: params.province, city: params.city },
      include: { events: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: 'asc' } } },
    });
  }

  findPending() {
    return this.prisma.church.findMany({ where: { status: ChurchStatus.PENDENTE } });
  }

  submit(userId: string | undefined, dto: CreateChurchDto) {
    return this.prisma.church.create({ data: { ...dto, submittedById: userId } as any });
  }

  async approve(id: string) {
    await this.ensureExists(id);
    return this.prisma.church.update({ where: { id }, data: { status: ChurchStatus.APROVADA } });
  }

  async reject(id: string) {
    await this.ensureExists(id);
    return this.prisma.church.update({ where: { id }, data: { status: ChurchStatus.REJEITADA } });
  }

  addEvent(churchId: string, data: { title: string; description?: string; startsAt: string; endsAt?: string; location?: string }) {
    return this.prisma.churchEvent.create({
      data: {
        churchId,
        title: data.title,
        description: data.description,
        location: data.location,
        startsAt: new Date(data.startsAt),
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      },
    });
  }

  private async ensureExists(id: string) {
    const church = await this.prisma.church.findUnique({ where: { id } });
    if (!church) throw new NotFoundException('Igreja não encontrada.');
  }
}
