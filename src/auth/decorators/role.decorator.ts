import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/user/entities/user.entity';
import { ROLE_METADATA } from '../auth.constants';

export type AllowedRoles = Array<UserRole | 'Any'>;

export const Role = (roles: AllowedRoles) => SetMetadata(ROLE_METADATA, roles);
