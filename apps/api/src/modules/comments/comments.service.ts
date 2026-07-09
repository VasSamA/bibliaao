import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommentStatus } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  findApprovedFor(target: { studyId?: string; articleId?: string; devotionalId?: string }) {
    return this.prisma.comment.findMany({
      where: { ...target, status: CommentStatus.APROVADO },
      include: { user: { select: { name: true, avatarUrl: true } }, replies: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  findPending() {
    return this.prisma.comment.findMany({
      where: { status: CommentStatus.PENDENTE },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  create(userId: string, dto: CreateCommentDto) {
    return this.prisma.comment.create({ data: { ...dto, userId } });
  }

  approve(id: string) {
    return this.prisma.comment.update({ where: { id }, data: { status: CommentStatus.APROVADO } });
  }

  reject(id: string) {
    return this.prisma.comment.update({ where: { id }, data: { status: CommentStatus.REJEITADO } });
  }
}
