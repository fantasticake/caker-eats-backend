import { Field, ObjectType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Restaurant } from '../entities/restaurant.entity';

@ObjectType()
export class SeeRestaurantsOutput extends SharedOutput {
  @Field(type => [Restaurant], { nullable: true })
  result?: Restaurant[];
}
