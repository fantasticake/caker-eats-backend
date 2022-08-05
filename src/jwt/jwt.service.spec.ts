import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtService } from './jwt.service';
import * as jwt from 'jsonwebtoken';

const JWT_KEY = 'JWT_KEY';
const TOKEN = 'TOKEN';

jest.mock('jsonwebtoken', () => {
  return {
    sign: jest.fn(() => TOKEN),
    verify: jest.fn(),
  };
});

const getMockedConfigService = () => ({
  get: jest.fn(() => JWT_KEY),
});

describe('JwtService', () => {
  const payload = { userId: 1 };
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        { provide: ConfigService, useValue: getMockedConfigService() },
      ],
    }).compile();
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(jwtService).toBeDefined();
  });

  describe('sign', () => {
    it('should return a token', () => {
      const result = jwtService.sign(payload);
      expect(jwt.sign).toBeCalledTimes(1);
      expect(jwt.sign).toBeCalledWith(payload, JWT_KEY);
      expect(result).toEqual(TOKEN);
    });
  });

  describe('verify', () => {
    it('should return true if token is valid', () => {
      (jwt.verify as jest.Mock).mockReturnValueOnce(true);
      const result = jwtService.verify(TOKEN);
      expect(jwt.verify).toBeCalledTimes(1);
      expect(jwt.verify).toBeCalledWith(TOKEN, JWT_KEY);
      expect(result).toEqual(true);
    });

    it('should return false if token is invalid', () => {
      (jwt.verify as jest.Mock).mockReturnValueOnce(false);
      const result = jwtService.verify(TOKEN);
      expect(result).toEqual(false);
    });
  });
});
