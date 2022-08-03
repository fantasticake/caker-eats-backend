import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  constructor(private readonly configService: ConfigService) {}
  sign(payload: any): string {
    return jwt.sign(payload, this.configService.get('JWT_KEY'));
  }

  verify(token: string): string | jwt.JwtPayload {
    return jwt.verify(token, this.configService.get('JWT_KEY'));
  }
}
