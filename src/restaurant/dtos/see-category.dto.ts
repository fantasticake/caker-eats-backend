import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import {
  PaginationInput,
  PaginationOutput,
  SharedOutput,
} from 'src/shared/shared.dto';
import { Category } from '../entities/catergory.entitiy';

@InputType()
export class SeeCategoryInput extends PaginationInput {
  @Field(type => String)
  slug: string;
}

@ObjectType()
export class SeeCategoryOutput extends PaginationOutput {
  @Field(type => Category, { nullable: true })
  result?: Category;
}
