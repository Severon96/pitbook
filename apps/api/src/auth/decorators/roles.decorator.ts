import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('ADMIN' | 'USER')[]) => SetMetadata(ROLES_KEY, roles);
