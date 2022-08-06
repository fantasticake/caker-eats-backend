import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Restaurant } from '../entities/restaurant.entity';

@InputType()
export class SearchRestaurantInput {
  @Field(type => String)
  key: string;
}

@ObjectType()
export class SearchRestaurantOutput extends SharedOutput {
  @Field(type => [Restaurant], { nullable: true })
  result?: Restaurant[];
}
