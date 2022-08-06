import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class SeeRestaurantInput {
  @Field(type => Number)
  restaurantId: number;
}

@ObjectType()
export class SeeRestaurantOutput extends SharedOutput {
  @Field(type => Restaurant, { nullable: true })
  result?: Restaurant;
}
