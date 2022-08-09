import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class OrderStatusChangedInput {
  @Field(type => Number)
  orderId: number;
}
