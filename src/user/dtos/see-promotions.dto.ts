import { Field, ObjectType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Promotion } from '../entities/promotion.entity';

@ObjectType()
export class SeePromotionsOutput extends SharedOutput {
  @Field(type => [Promotion], { nullable: true })
  result?: Promotion[];
}
