import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  findMine(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async create(userId: string, title: string, body: string, channel: NotificationChannel = NotificationChannel.IN_APP) {
    return this.prisma.notification.create({ data: { userId, title, body, channel } });
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { status: NotificationStatus.LIDA, readAt: new Date() } });
  }

  /** Envio em massa (ex: novo devocional do dia). Integração real com e-mail/FCM fica em `EMAIL_PROVIDER`/`FCM_SERVER_KEY`. */
  async broadcast(title: string, body: string, channel: NotificationChannel = NotificationChannel.EMAIL) {
    const users = await this.prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    await this.prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, title, body, channel })),
    });
    return { sent: users.length };
  }
}
