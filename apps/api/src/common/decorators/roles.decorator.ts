import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
/**
 * Restringe um endpoint a um conjunto de perfis (RBAC).
 * Uso: @Roles(UserRole.ADMINISTRADOR, UserRole.SUPER_ADMINISTRADOR)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
