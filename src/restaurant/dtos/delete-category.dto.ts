import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Category } from '../entities/catergory.entitiy';

@InputType()
export class DeleteCategoryInput extends PickType(
  Category,
  ['slug'],
  InputType,
) {}

@ObjectType()
export class DeleteCategoryOutput extends SharedOutput {}
