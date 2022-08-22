import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mailgun from 'mailgun-js';

@Injectable()
export class MailService {
  constructor(private readonly configService: ConfigService) {}
  async sendVerificationEmail(email: string, code: string) {
    try {
      const mg = mailgun({
        apiKey: this.configService.get('MAILGUN_API_KEY'),
        domain: this.configService.get('MAILGUN_DOMAIN'),
      });
      await mg.messages().send({
        from: 'Caker eats <cakereats@cakereats.gmail.com>',
        to: email,
        subject: 'Caker eats verify email',
        template: 'verify-email',
        'v:username': email,
        'v:verifyLink': `localhost:4000/verify-email/${code}`,
      });
    } catch (error) {
      console.log(error);
    }
  }
}
