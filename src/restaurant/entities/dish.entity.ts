import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { SharedEntity } from 'src/shared/shared.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@ObjectType()
@InputType('DishOptionInput', { isAbstract: true })
class DishOption {
  @Field(type => String)
  name: string;

  @Field(type => Number, { nullable: true })
  extra?: number;
}

@Entity()
@ObjectType()
export class Dish extends SharedEntity {
  @Column()
  @Field(type => String)
  name: string;

  @Column({ nullable: true })
  @Field(type => String, { nullable: true })
  description?: string;

  @Column({ nullable: true })
  @Field(type => String, { nullable: true })
  imageUrl: string;

  @Column()
  @Field(type => Number)
  price: number;

  @ManyToOne(type => Restaurant, (restaurant: Restaurant) => restaurant.menu, {
    onDelete: 'CASCADE',
  })
  @Field(type => Restaurant)
  restaurant: Restaurant;

  @Column({ type: 'json', nullable: true })
  @Field(type => [DishOption], { nullable: true })
  options?: DishOption[];
}
