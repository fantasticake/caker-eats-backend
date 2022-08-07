import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { CreateDishInput } from './create-dish.dto';

@InputType()
export class EditDishInput extends PartialType(CreateDishInput) {
  @Field(type => Number)
  dishId: number;
}

@ObjectType()
export class EditDishOutput extends SharedOutput {}
