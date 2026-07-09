import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Hierarquia de perfis (do menor para o maior privilégio). Um utilizador
 * com um perfil mais alto satisfaz automaticamente requisitos de perfis
 * mais baixos, exceto onde a lógica de negócio exigir um perfil exato.
 */
export const ROLE_HIERARCHY: UserRole[] = [
  UserRole.VISITANTE,
  UserRole.UTILIZADOR_REGISTADO,
  UserRole.ESTUDANTE,
  UserRole.LIDER,
  UserRole.PASTOR,
  UserRole.EDITOR_CONTEUDO,
  UserRole.MODERADOR,
  UserRole.ADMINISTRADOR,
  UserRole.SUPER_ADMINISTRADOR,
];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('Autenticação necessária.');

    const userLevel = ROLE_HIERARCHY.indexOf(user.role);
    const minRequiredLevel = Math.min(...requiredRoles.map((r) => ROLE_HIERARCHY.indexOf(r)));

    if (userLevel < minRequiredLevel) {
      throw new ForbiddenException('Não tem permissão para aceder a este recurso.');
    }
    return true;
  }
}
