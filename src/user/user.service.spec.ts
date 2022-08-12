import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HASH_ROUNDS, UserService } from './user.service';
import { User, UserRole } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { HASHED_PASSWORD, customerTestData } from 'src/test/test.data';

const PASSWORD = 'password';
const TOKEN = 'token';

jest.mock('bcrypt', () => {
  return {
    hash: jest.fn(() => HASHED_PASSWORD),
    compare: jest.fn(),
  };
});

const getMockedRepository = () => ({
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
});

const getMockedJwtService = () => ({
  sign: jest.fn(),
  verify: jest.fn(),
});

const getMockedMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

describe('UserService', () => {
  const verificationData = {
    code: 'code',
  };
  let userService: UserService;
  let mailService: Record<keyof MailService, jest.Mock>;
  let jwtService: Record<keyof JwtService, jest.Mock>;
  let usersRepository: Record<keyof Repository<User>, jest.Mock>;
  let verificationsRepository: Record<
    keyof Repository<Verification>,
    jest.Mock
  >;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: getMockedRepository() },
        {
          provide: getRepositoryToken(Verification),
          useValue: getMockedRepository(),
        },
        { provide: JwtService, useValue: getMockedJwtService() },
        { provide: MailService, useValue: getMockedMailService() },
      ],
    }).compile();
    userService = module.get(UserService);
    mailService = module.get(MailService);
    jwtService = module.get(JwtService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationsRepository = module.get(getRepositoryToken(Verification));
  });

  afterEach(() => {
    (bcrypt.hash as jest.Mock).mockClear();
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user', async () => {
      usersRepository.findOneBy.mockResolvedValueOnce(customerTestData);
      const result = await userService.findById(customerTestData.id);
      expect(usersRepository.findOneBy).toBeCalledTimes(1);
      expect(usersRepository.findOneBy).toBeCalledWith({
        id: customerTestData.id,
      });
      expect(result).toEqual(customerTestData);
    });
  });

  describe('createUser', () => {
    const input = {
      email: customerTestData.email,
      password: PASSWORD,
      role: customerTestData.role,
    };

    it('should return an error if role is admin', async () => {
      const result = await userService.createUser({
        ...input,
        role: UserRole.Admin,
      });
      expect(result).toEqual({
        ok: false,
        error: 'Cannot create with admin role.',
      });
    });

    it('should return an error if email exists', async () => {
      usersRepository.findOneBy.mockResolvedValueOnce(customerTestData);
      const result = await userService.createUser(input);
      expect(usersRepository.findOneBy).toBeCalledTimes(1);
      expect(usersRepository.findOneBy).toBeCalledWith({ email: input.email });
      expect(result).toEqual({ ok: false, error: 'Email already exists.' });
    });

    it('should create a user', async () => {
      usersRepository.findOneBy.mockResolvedValueOnce(null);
      usersRepository.create.mockReturnValueOnce(customerTestData);
      verificationsRepository.create.mockReturnValueOnce(verificationData);
      verificationsRepository.save.mockResolvedValueOnce(verificationData);
      const result = await userService.createUser(input);
      expect(bcrypt.hash).toBeCalledTimes(1);
      expect(bcrypt.hash).toBeCalledWith(input.password, HASH_ROUNDS);
      expect(usersRepository.create).toBeCalledTimes(1);
      expect(usersRepository.create).toBeCalledWith({
        ...input,
        password: HASHED_PASSWORD,
      });
      expect(usersRepository.save).toBeCalledTimes(1);
      expect(usersRepository.save).toBeCalledWith(customerTestData);
      expect(verificationsRepository.create).toBeCalledTimes(1);
      expect(verificationsRepository.create).toBeCalledWith({
        code: expect.any(String),
        email: input.email,
      });
      expect(verificationsRepository.save).toBeCalledTimes(1);
      expect(verificationsRepository.save).toBeCalledWith(verificationData);
      expect(mailService.sendVerificationEmail).toBeCalledTimes(1);
      expect(mailService.sendVerificationEmail).toBeCalledWith(
        input.email,
        verificationData.code,
      );
      expect(result).toEqual({ ok: true });
    });

    it('should return an error if it fails', async () => {
      usersRepository.findOneBy.mockRejectedValueOnce(new Error());
      const result = await userService.createUser(input);
      expect(result).toEqual({ ok: false, error: 'Cannot create a user.' });
    });
  });

  describe('login', () => {
    const input = {
      email: customerTestData.email,
      password: PASSWORD,
    };
    it('should return an error if user not found', async () => {
      usersRepository.findOneBy.mockResolvedValueOnce(null);
      const result = await userService.login(input);
      expect(usersRepository.findOneBy).toBeCalledTimes(1);
      expect(usersRepository.findOneBy).toBeCalledWith({ email: input.email });
      expect(result).toEqual({ ok: false, error: 'User not found.' });
    });

    it('should return an error if password is invalid', async () => {
      usersRepository.findOneBy.mockResolvedValueOnce(customerTestData);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      const result = await userService.login(input);
      expect(bcrypt.compare).toBeCalledTimes(1);
      expect(bcrypt.compare).toBeCalledWith(
        input.password,
        customerTestData.password,
      );
      expect(result).toEqual({ ok: false, error: 'Invalid password.' });
    });

    it('should return a token', async () => {
      usersRepository.findOneBy.mockResolvedValueOnce(customerTestData);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      jwtService.sign.mockReturnValueOnce(TOKEN);
      const result = await userService.login(input);
      expect(jwtService.sign).toBeCalledTimes(1);
      expect(jwtService.sign).toBeCalledWith({ userId: customerTestData.id });
      expect(result).toEqual({ ok: true, token: TOKEN });
    });

    it('should return an error if it fails', async () => {
      usersRepository.findOneBy.mockRejectedValueOnce(new Error());
      const result = await userService.login(input);
      expect(result).toEqual({ ok: false, error: 'Cannot login.' });
    });
  });

  describe('editUser', () => {
    const input = {
      email: 'new@email.com',
      password: 'new.password',
    };
    it('should return an error if email exists', async () => {
      usersRepository.findOneBy.mockResolvedValueOnce(customerTestData);
      const result = await userService.editUser(
        { email: input.email },
        customerTestData,
      );
      expect(usersRepository.findOneBy).toBeCalledTimes(1);
      expect(usersRepository.findOneBy).toBeCalledWith({ email: input.email });
      expect(result).toEqual({ ok: false, error: 'Email already exists.' });
    });

    it('should edit a user', async () => {
      usersRepository.findOneBy.mockResolvedValueOnce(null);
      verificationsRepository.create.mockReturnValueOnce(verificationData);
      verificationsRepository.save.mockResolvedValueOnce(verificationData);
      const result = await userService.editUser(input, customerTestData);
      expect(bcrypt.hash).toBeCalledTimes(1);
      expect(bcrypt.hash).toBeCalledWith(input.password, HASH_ROUNDS);
      expect(usersRepository.save).toBeCalledTimes(1);
      expect(usersRepository.save).toBeCalledWith({
        id: customerTestData.id,
        email: input.email,
        password: HASHED_PASSWORD,
      });
      expect(verificationsRepository.delete).toBeCalledTimes(1);
      expect(verificationsRepository.delete).toBeCalledWith({
        email: customerTestData.email,
      });
      expect(verificationsRepository.create).toBeCalledTimes(1);
      expect(verificationsRepository.create).toBeCalledWith({
        code: expect.any(String),
        email: input.email,
      });
      expect(verificationsRepository.save).toBeCalledTimes(1);
      expect(verificationsRepository.save).toBeCalledWith(verificationData);
      expect(mailService.sendVerificationEmail).toBeCalledTimes(1);
      expect(mailService.sendVerificationEmail).toBeCalledWith(
        input.email,
        verificationData.code,
      );
      expect(result).toEqual({ ok: true });
    });

    it('should return an error if it fails', async () => {
      usersRepository.findOneBy.mockRejectedValueOnce(new Error());
      const result = await userService.editUser(
        { email: input.email },
        customerTestData,
      );
      expect(result).toEqual({ ok: false, error: 'Cannot edit user.' });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const result = await userService.deleteUser(customerTestData);
      expect(usersRepository.delete).toBeCalledTimes(1);
      expect(usersRepository.delete).toBeCalledWith({
        id: customerTestData.id,
      });
      expect(result).toEqual({ ok: true });
    });

    it('should return an error if it fails', async () => {
      usersRepository.delete.mockRejectedValueOnce(new Error());
      const result = await userService.deleteUser(customerTestData);
      expect(result).toEqual({ ok: false, error: 'Cannot delete user.' });
    });
  });

  describe('verifyEmail', () => {
    const input = {
      code: verificationData.code,
    };
    it('should return an error if verification is invalid', async () => {
      verificationsRepository.findOneBy.mockResolvedValueOnce(null);
      const result = await userService.verifyEmail(input, customerTestData);
      expect(verificationsRepository.findOneBy).toBeCalledTimes(1);
      expect(verificationsRepository.findOneBy).toBeCalledWith({
        code: input.code,
        email: customerTestData.email,
      });
      expect(result).toEqual({ ok: false, error: 'Invalid verification code' });
    });

    it('should verify an email', async () => {
      verificationsRepository.findOneBy.mockResolvedValueOnce(verificationData);
      const result = await userService.verifyEmail(input, customerTestData);
      expect(customerTestData.verified).toBe(true);
      expect(usersRepository.save).toBeCalledTimes(1);
      expect(usersRepository.save).toBeCalledWith(customerTestData);
      expect(verificationsRepository.delete).toBeCalledTimes(1);
      expect(verificationsRepository.delete).toBeCalledWith({
        code: input.code,
      });
      expect(result).toEqual({ ok: true });
    });

    it('should return an error if it fails', async () => {
      verificationsRepository.findOneBy.mockRejectedValueOnce(new Error());
      const result = await userService.verifyEmail(input, customerTestData);
      expect(result).toEqual({ ok: false, error: 'Cannot verify email.' });
    });
  });
});
