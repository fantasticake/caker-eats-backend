import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}
  async createUser(input: CreateUserInput): Promise<CreateUserOutput> {
    try {
      const existingUser = await this.usersRepository.findOneBy({
        email: input.email,
      });
      if (existingUser) return { ok: false, error: 'Email already used.' };

      const hashed = await bcrypt.hash(input.password, 10);
      this.usersRepository.save(
        this.usersRepository.create({ ...input, password: hashed }),
      );
      return { ok: true };
    } catch (error) {
      console.log(error);
      return { ok: false, error: 'Cannot create a user.' };
    }
  }
}
