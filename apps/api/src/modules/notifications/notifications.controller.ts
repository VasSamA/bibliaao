import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('notificacoes')
@Controller('notificacoes')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(@CurrentUser() user: { id: string }) {
    return this.notificationsService.findMine(user.id);
  }

  @Patch(':id/lida')
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }

  @Roles(UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Post('difundir')
  broadcast(@Body() body: { title: string; body: string }) {
    return this.notificationsService.broadcast(body.title, body.body);
  }
}
