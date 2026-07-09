import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertNoteDto } from './dto/upsert-note.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  findMine(userId: string) {
    return this.prisma.userNote.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  create(userId: string, dto: UpsertNoteDto) {
    return this.prisma.userNote.create({ data: { ...dto, userId } });
  }

  async update(userId: string, id: string, content: string) {
    const note = await this.prisma.userNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Nota não encontrada.');
    if (note.userId !== userId) throw new ForbiddenException();
    return this.prisma.userNote.update({ where: { id }, data: { content } });
  }

  async remove(userId: string, id: string) {
    const note = await this.prisma.userNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException('Nota não encontrada.');
    if (note.userId !== userId) throw new ForbiddenException();
    return this.prisma.userNote.delete({ where: { id } });
  }
}
