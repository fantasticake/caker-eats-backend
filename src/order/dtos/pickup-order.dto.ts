import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';

@InputType()
export class PickupOrderInput {
  @Field(type => Number)
  orderId: number;
}

@ObjectType()
export class PickupOrderOutput extends SharedOutput {
  @Field(type => Number, { nullable: true })
  orderId?: number;
}
