import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MailService } from './mail.service';
import * as mailgun from 'mailgun-js';

const mockedMailgunSend = jest.fn();

jest.mock('mailgun-js', () => {
  return jest.fn(() => ({
    messages: jest.fn(() => ({ send: mockedMailgunSend })),
  }));
});

const EV = 'EV';

const getMockedConfigService = () => ({
  get: jest.fn(() => EV),
});

describe('MailService', () => {
  let mailService: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: ConfigService, useValue: getMockedConfigService() },
      ],
    }).compile();
    mailService = module.get(MailService);
  });

  it('should be defined', () => {
    expect(mailService).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    const input = {
      email: 'test@email.com',
      code: 'CODE',
    };

    it('should send a mail', async () => {
      await mailService.sendVerificationEmail(input.email, input.code);
      expect(mailgun).toBeCalledTimes(1);
      expect(mailgun).toBeCalledWith({ apiKey: EV, domain: EV });
      expect(mockedMailgunSend).toBeCalledTimes(1);
      expect(mockedMailgunSend).toBeCalledWith({
        from: 'Caker eats <cakereats@cakereats.gmail.com>',
        to: input.email,
        subject: 'Caker eats verify email',
        template: 'verify-email',
        'v:username': input.email,
        'v:verifyLink': `localhost:4000/verify-email/${input.code}`,
      });
    });
  });
});
