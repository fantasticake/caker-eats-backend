import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Promotion } from '../entities/promotion.entity';

@InputType()
export class CreatePromotionInput extends PickType(
  Promotion,
  ['transactionId'],
  InputType,
) {}

@ObjectType()
export class CreatePromotionOutput extends SharedOutput {}
