import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from 'src/user/entities/user.entity';
import { ROLE_METADATA } from './auth.constants';
import { AllowedRoles } from './decorators/role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const allowedRoles = this.reflector.get<AllowedRoles>(
      ROLE_METADATA,
      context.getHandler(),
    );
    if (!allowedRoles) return true;

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const loggedInUser: User = gqlContext.loggedInUser;
    if (!loggedInUser) return false;
    if (allowedRoles.includes(loggedInUser.role)) return true;
    return false;
  }
}
