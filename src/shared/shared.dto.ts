import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SharedOutput {
  @Field(type => Boolean)
  ok: boolean;

  @Field(type => String, { nullable: true })
  error?: string;
}

@InputType()
export class PaginationInput {
  @Field(type => Number, { defaultValue: 1 })
  page?: number;
}

@ObjectType()
export class PaginationOutput extends SharedOutput {
  @Field(type => Number, { nullable: true })
  totalPages?: number;
}
