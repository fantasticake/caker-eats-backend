import { Field, ObjectType } from '@nestjs/graphql';
import { SharedEntity } from 'src/shared/shared.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Category } from './catergory.entitiy';
import { Dish } from './dish.entity';

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

  @ManyToOne(type => Category, (category: Category) => category.restaurants)
  @Field(type => Category)
  category: Category;

  @OneToMany(type => Dish, (dish: Dish) => dish.restaurant)
  @Field(type => [Dish])
  menu: Dish[];
}
