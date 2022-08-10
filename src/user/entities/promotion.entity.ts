import { Field, ObjectType } from '@nestjs/graphql';
import { SharedEntity } from 'src/shared/shared.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
@ObjectType()
export class Promotion extends SharedEntity {
  @Column({ unique: true })
  @Field(type => Number)
  transactionId: number;

  @ManyToOne(type => User, (user: User) => user.promotions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Field(type => User, { nullable: true })
  owner?: User;
}
