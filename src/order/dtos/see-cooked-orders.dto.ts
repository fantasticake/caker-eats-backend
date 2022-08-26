import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { PaginationInput, PaginationOutput } from 'src/shared/shared.dto';
import { Order } from '../entities/order.entity';

@InputType()
export class SeeCookedOrdersInput extends PaginationInput {}

@ObjectType()
export class SeeCookedOrdersOutput extends PaginationOutput {
  @Field(type => [Order], { nullable: true })
  result?: Order[];
}
