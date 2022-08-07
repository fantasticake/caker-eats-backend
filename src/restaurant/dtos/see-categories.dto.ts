import { Field, ObjectType } from '@nestjs/graphql';
import { SharedOutput } from 'src/shared/shared.dto';
import { Category } from '../entities/catergory.entitiy';

@ObjectType()
export class SeeCategoriesOutput extends SharedOutput {
  @Field(type => [Category], { nullable: true })
  result?: Category[];
}
