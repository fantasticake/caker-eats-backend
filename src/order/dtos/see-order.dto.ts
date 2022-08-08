import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Order } from '../entities/order.entity';

@InputType()
export class SeeOrderInput {
  @Field(type => Number)
  orderId: number;
}

@ObjectType()
export class SeeOrderOutput extends SharedOutput {
  @Field(type => Order, { nullable: true })
  result?: Order;
}
