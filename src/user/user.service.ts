import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from 'src/jwt/jwt.service';
import { EditUserInput, EditUserOutput } from './dtos/edit-user.dto';
import { DeleteUserOutput } from './dtos/delete-user.dto';

const HASH_ROUNDS = 10;

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}
  findById(id: number): Promise<User> {
    return this.usersRepository.findOneBy({ id });
  }

  async createUser(input: CreateUserInput): Promise<CreateUserOutput> {
    try {
      const existingUser = await this.usersRepository.findOneBy({
        email: input.email,
      });
      if (existingUser) return { ok: false, error: 'Email already exists.' };

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
      await this.usersRepository.save([
        {
          id: user.id,
          ...(input?.email && { email: input.email }),
          ...(input?.password && { password: hashed }),
        },
      ]);
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
}
