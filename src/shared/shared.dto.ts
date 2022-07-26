import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SharedOutput {
  @Field(type => Boolean)
  ok: boolean;

  @Field(type => String, { nullable: true })
  error?: string;
}
