import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { UpsertResourceDto } from './dto/upsert-resource.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ResourceType } from '@prisma/client';

@ApiTags('recursos')
@Controller('recursos')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Public()
  @Get()
  findAll(@Query('type') type?: ResourceType, @Query('audience') audience?: string, @Query('page') page?: string) {
    return this.resourcesService.findApproved({ type, audience, page: page ? Number(page) : undefined });
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Get('pendentes')
  findPending() {
    return this.resourcesService.findPendingApproval();
  }

  @Roles(UserRole.EDITOR_CONTEUDO, UserRole.LIDER, UserRole.PASTOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Post()
  create(@Body() dto: UpsertResourceDto) {
    return this.resourcesService.create(dto);
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Patch(':id/aprovar')
  approve(@Param('id') id: string) {
    return this.resourcesService.approve(id);
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Patch(':id/rejeitar')
  reject(@Param('id') id: string) {
    return this.resourcesService.reject(id);
  }

  @Public()
  @Patch(':id/download')
  registerDownload(@Param('id') id: string) {
    return this.resourcesService.registerDownload(id);
  }
}
