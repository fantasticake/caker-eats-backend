import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Category } from '../entities/catergory.entitiy';

@InputType()
export class CreateCategoryInput extends PickType(
  Category,
  ['name', 'imageUrl'],
  InputType,
) {}

@ObjectType()
export class CreateCategoryOutput extends SharedOutput {}
