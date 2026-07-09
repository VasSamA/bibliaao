import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  findMine(userId: string) {
    return this.prisma.userFavorite.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  add(userId: string, dto: CreateFavoriteDto) {
    return this.prisma.userFavorite.upsert({
      where: { userId_reference: { userId, reference: dto.reference } },
      update: { colorTag: dto.colorTag },
      create: { ...dto, userId },
    });
  }

  remove(userId: string, reference: string) {
    return this.prisma.userFavorite.delete({ where: { userId_reference: { userId, reference } } });
  }
}
