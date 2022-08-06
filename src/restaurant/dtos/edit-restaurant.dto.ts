import { InputType, ObjectType, PartialType, PickType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class EditRestaurantInput extends PartialType(
  PickType(Restaurant, ['name'], InputType),
) {}

@ObjectType()
export class EditRestaurantOutput extends SharedOutput {}
