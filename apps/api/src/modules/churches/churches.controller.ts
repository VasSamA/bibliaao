import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChurchesService } from './churches.service';
import { CreateChurchDto } from './dto/create-church.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('igrejas')
@Controller('igrejas')
export class ChurchesController {
  constructor(private readonly churchesService: ChurchesService) {}

  @Public()
  @Get()
  findAll(@Query('province') province?: string, @Query('city') city?: string) {
    return this.churchesService.findApproved({ province, city });
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Get('pendentes')
  findPending() {
    return this.churchesService.findPending();
  }

  @Public()
  @Post()
  submit(@CurrentUser() user: { id: string } | undefined, @Body() dto: CreateChurchDto) {
    return this.churchesService.submit(user?.id, dto);
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Patch(':id/aprovar')
  approve(@Param('id') id: string) {
    return this.churchesService.approve(id);
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Patch(':id/rejeitar')
  reject(@Param('id') id: string) {
    return this.churchesService.reject(id);
  }

  @Roles(UserRole.LIDER, UserRole.PASTOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Post(':id/eventos')
  addEvent(@Param('id') id: string, @Body() body: { title: string; description?: string; startsAt: string; endsAt?: string; location?: string }) {
    return this.churchesService.addEvent(id, body);
  }
}
