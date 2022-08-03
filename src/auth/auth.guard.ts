import { CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context).getContext();
    if (!gqlContext.loggedInUser) return false;
    return true;
  }
}
