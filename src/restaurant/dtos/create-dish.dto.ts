import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Dish } from '../entities/dish.entity';

@InputType()
export class CreateDishInput extends PickType(
  Dish,
  ['name', 'description', 'price', 'options', 'imageUrl'],
  InputType,
) {}

@ObjectType()
export class CreateDishOutput extends SharedOutput {
  @Field(type => Number, { nullable: true })
  dishId?: number;
}
