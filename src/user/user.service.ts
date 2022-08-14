import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { JwtService } from 'src/jwt/jwt.service';
import { EditUserInput, EditUserOutput } from './dtos/edit-user.dto';
import { DeleteUserOutput } from './dtos/delete-user.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { Verification } from './entities/verification.entity';
import { MailService } from 'src/mail/mail.service';

export const HASH_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Verification)
    private readonly verificationsRepository: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}
  findById(id: number): Promise<User> {
    return this.usersRepository.findOneBy({ id });
  }

  async createUser(input: CreateUserInput): Promise<CreateUserOutput> {
    try {
      if (input.role == UserRole.Admin) {
        const existingAdmin = await this.usersRepository.findOneBy({
          role: UserRole.Admin,
        });
        if (existingAdmin) return { ok: false, error: 'Admin already exists.' };
      }

      const existingUser = await this.usersRepository.findOneBy({
        email: input.email,
      });
      if (existingUser) return { ok: false, error: 'Email already exists.' };

      const hashed = await bcrypt.hash(input.password, HASH_ROUNDS);
      this.usersRepository.save(
        this.usersRepository.create({ ...input, password: hashed }),
      );

      if (input.role != UserRole.Admin) {
        const verification = await this.verificationsRepository.save(
          this.verificationsRepository.create({
            code: Date.now() + '',
            email: input.email,
          }),
        );
        await this.mailService.sendVerificationEmail(
          input.email,
          verification.code,
        );
      }

      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot create a user.' };
    }
  }

  async login(input: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.usersRepository.findOneBy({ email: input.email });
      if (!user) {
        return { ok: false, error: 'User not found.' };
      }
      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        return { ok: false, error: 'Invalid password.' };
      }
      const token = this.jwtService.sign({ userId: user.id });
      return { ok: true, token };
    } catch {
      return { ok: false, error: 'Cannot login.' };
    }
  }

  async editUser(input: EditUserInput, user: User): Promise<EditUserOutput> {
    try {
      if (input.email) {
        const existingUser = await this.usersRepository.findOneBy({
          email: input.email,
        });
        if (existingUser) return { ok: false, error: 'Email already exists.' };
      }
      let hashed;
      if (input?.password)
        hashed = await bcrypt.hash(input.password, HASH_ROUNDS);
      await this.usersRepository.save({
        id: user.id,
        ...(input?.email && { email: input.email }),
        ...(input?.password && { password: hashed }),
      });
      if (input.email) {
        this.verificationsRepository.delete({ email: user.email });
        const verification = await this.verificationsRepository.save(
          this.verificationsRepository.create({
            code: Date.now() + '',
            email: input.email,
          }),
        );
        await this.mailService.sendVerificationEmail(
          input.email,
          verification.code,
        );
      }
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot edit user.' };
    }
  }

  async deleteUser(user: User): Promise<DeleteUserOutput> {
    try {
      await this.usersRepository.delete({ id: user.id });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot delete user.' };
    }
  }

  async verifyEmail(
    input: VerifyEmailInput,
    user: User,
  ): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verificationsRepository.findOneBy({
        code: input.code,
        email: user.email,
      });
      if (!verification) {
        return { ok: false, error: 'Invalid verification code' };
      }
      user.verified = true;
      await this.usersRepository.save(user);
      await this.verificationsRepository.delete({ code: input.code });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot verify email.' };
    }
  }
}
