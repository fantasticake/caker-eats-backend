import { Field, ObjectType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { User } from '../entities/user.entity';

@ObjectType()
export class SeeMeOutput extends SharedOutput {
  @Field(type => User, { nullable: true })
  result?: User;
}
