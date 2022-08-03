import { NextFunction, Request, Response } from 'express';
import { HEADER_TOKEN } from './jwt.constants';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers[HEADER_TOKEN];
      if (typeof token == 'string') {
        const decoded = this.jwtService.verify(token);
        if (typeof decoded == 'object' && decoded?.userId) {
          const user = await this.userService.findById(decoded.userId);
          req['user'] = user;
        }
      }
    } catch (error) {
      console.log(error);
    }
    next();
  }
}
