import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class EditRestaurantInput extends PartialType(
  PickType(Restaurant, ['name'], InputType),
) {
  @Field(type => Number, { nullable: true })
  categoryId?: number;
}

@ObjectType()
export class EditRestaurantOutput extends SharedOutput {}
