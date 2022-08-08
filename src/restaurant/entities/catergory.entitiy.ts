import { Field, ObjectType } from '@nestjs/graphql';
import { SharedEntity } from 'src/shared/shared.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Entity()
@ObjectType()
export class Category extends SharedEntity {
  @Column({ unique: true })
  @Field(type => String)
  name: string;

  @Column({ unique: true })
  @Field(type => String)
  slug: string;

  @Column({ nullable: true })
  @Field(type => String, { nullable: true })
  imageUrl: string;

  @OneToMany(
    type => Restaurant,
    (restaurant: Restaurant) => restaurant.category,
  )
  @Field(type => [Restaurant])
  restaurants: Restaurant[];
}
