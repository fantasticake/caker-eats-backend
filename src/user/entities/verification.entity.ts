import { Field, ObjectType } from '@nestjs/graphql';
import { SharedEntity } from 'src/shared/shared.entity';
import { Column, Entity } from 'typeorm';

@Entity()
@ObjectType()
export class Verification extends SharedEntity {
  @Field(type => String)
  @Column({ unique: true })
  code: string;

  @Field(type => String)
  @Column({ unique: true })
  email: string;
}
