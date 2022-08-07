import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';

@InputType()
export class DeleteDishInput {
  @Field(type => Number)
  dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends SharedOutput {}
