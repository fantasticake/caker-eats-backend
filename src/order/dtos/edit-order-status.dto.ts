import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Order } from '../entities/order.entity';

@InputType()
export class EditOrderStatusInput extends PickType(
  Order,
  ['status'],
  InputType,
) {
  @Field(type => Number)
  orderId: number;
}

@ObjectType()
export class EditOrderStatusOutput extends SharedOutput {}
