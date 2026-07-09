import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('auditoria')
@Controller('auditoria')
@Roles(UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  findAll(@Query('page') page?: string) {
    return this.auditLogsService.findAll(page ? Number(page) : undefined);
  }
}
