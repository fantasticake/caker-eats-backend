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
  PickType(Restaurant, ['name', 'imageUrl'], InputType),
) {
  @Field(type => String, { nullable: true })
  categorySlug?: string;
}

@ObjectType()
export class EditRestaurantOutput extends SharedOutput {}
