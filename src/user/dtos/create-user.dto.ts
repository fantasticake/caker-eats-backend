import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { User } from '../entities/user.entity';

@InputType()
export class CreateUserInput extends PickType(
  User,
  ['email', 'password', 'role'],
  InputType,
) {}

@ObjectType()
export class CreateUserOutput extends SharedOutput {}
