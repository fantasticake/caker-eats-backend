import { Field, ObjectType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Order } from '../entities/order.entity';

@ObjectType()
export class SeeOrdersOutput extends SharedOutput {
  @Field(type => [Order], { nullable: true })
  result?: Order[];
}
