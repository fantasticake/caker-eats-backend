import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { ROLE_METADATA } from './auth.constants';
import { AllowedRoles } from './decorators/role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const allowedRoles = this.reflector.get<AllowedRoles>(
        ROLE_METADATA,
        context.getHandler(),
      );
      if (!allowedRoles) return true;

      const gqlContext = GqlExecutionContext.create(context).getContext();
      const token: string = gqlContext.token;
      if (!token) return false;

      const decoded = this.jwtService.verify(token);
      let loggedInUser: User;
      if (typeof decoded == 'object' && decoded?.userId) {
        loggedInUser = await this.userService.findById(decoded.userId);
        gqlContext.loggedInUser = loggedInUser;
      }
      if (!loggedInUser) return false;
      if (
        allowedRoles.includes('Any') ||
        allowedRoles.includes(loggedInUser.role)
      )
        return true;
      return false;
    } catch (error) {}
  }
}
