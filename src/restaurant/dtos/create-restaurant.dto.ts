import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class CreateRestaurantInput extends PickType(
  Restaurant,
  ['name'],
  InputType,
) {
  @Field(type => Number)
  categoryId: number;
}

@ObjectType()
export class CreateRestaurantOutput extends SharedOutput {}
