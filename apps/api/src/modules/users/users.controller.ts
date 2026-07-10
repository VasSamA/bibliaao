import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('users')
@Controller('utilizadores')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('perfil')
  getProfile(@CurrentUser() user: { id: string }) {
    return this.usersService.findOne(user.id);
  }

  @Patch('perfil')
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @Patch('perfil/senha')
  changePassword(@CurrentUser() user: { id: string }, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Roles(UserRole.MODERADOR, UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Get()
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('role') role?: UserRole) {
    return this.usersService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      role,
    });
  }

  @Roles(UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Roles(UserRole.SUPER_ADMINISTRADOR)
  @Patch(':id/perfil-acesso')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }

  @Roles(UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
  @Patch(':id/desativar')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}
