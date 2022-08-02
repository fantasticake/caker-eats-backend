import { InputType, ObjectType, PartialType, PickType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { User } from '../entities/user.entity';

@InputType()
export class EditUserInput extends PartialType(
  PickType(User, ['email', 'password'], InputType),
) {}

@ObjectType()
export class EditUserOutput extends SharedOutput {}
