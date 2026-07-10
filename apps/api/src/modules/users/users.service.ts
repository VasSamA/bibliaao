import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { page?: number; pageSize?: number; role?: UserRole }) {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 20;
    const where = params.role ? { role: params.role } : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const updated = await this.prisma.user.update({ where: { id }, data: dto });
    const { passwordHash, ...safe } = updated;
    return safe;
  }

  async updateRole(id: string, role: UserRole) {
    await this.findOne(id);
    const updated = await this.prisma.user.update({ where: { id }, data: { role } });
    const { passwordHash, ...safe } = updated;
    return safe;
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Utilizador não encontrado.');

    const currentValid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!currentValid) throw new UnauthorizedException('Senha atual incorreta.');

    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException('A nova senha deve ser diferente da atual.');
    }

    const passwordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    return { message: 'Senha alterada com sucesso.' };
  }
}
