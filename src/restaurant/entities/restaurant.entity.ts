import { Field, ObjectType } from '@nestjs/graphql';
import { SharedEntity } from 'src/shared/shared.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';

@Entity()
@ObjectType()
export class Restaurant extends SharedEntity {
  @Column({ unique: true })
  @Field(type => String)
  name: string;

  @OneToOne(type => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  @Field(type => User)
  owner: User;

  //category, menu
}
