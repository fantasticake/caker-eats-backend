import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Dish } from '../entities/dish.entity';

@InputType()
export class SeeDishesInput {
  @Field(type => Number)
  restaurantId: number;
}

@ObjectType()
export class SeeDishesOutput extends SharedOutput {
  @Field(type => [Dish], { nullable: true })
  result?: Dish[];
}
