import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Order } from '../entities/order.entity';

@InputType()
export class CreateOrderInput extends PickType(
  Order,
  ['dishes', 'location'],
  InputType,
) {
  @Field(type => Number)
  restaurantId: number;
}

@ObjectType()
export class CreateOrderOutput extends SharedOutput {
  @Field(type => Number, { nullable: true })
  orderId?: number;
}
