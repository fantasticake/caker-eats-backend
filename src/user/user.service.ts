import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { ConfigService } from '@nestjs/config';

const HASH_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {}
  async createUser(input: CreateUserInput): Promise<CreateUserOutput> {
    try {
      const existingUser = await this.usersRepository.findOneBy({
        email: input.email,
      });
      if (existingUser) return { ok: false, error: 'Email already used.' };

      const hashed = await bcrypt.hash(input.password, HASH_ROUNDS);
      this.usersRepository.save(
        this.usersRepository.create({ ...input, password: hashed }),
      );
      return { ok: true };
    } catch (error) {
      console.log(error);
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
      const token = jwt.sign(
        { userId: user.id },
        this.configService.get('JWT_KEY'),
      );
      return { ok: true, token };
    } catch {
      return { ok: false, error: 'Cannot login.' };
    }
  }
}
