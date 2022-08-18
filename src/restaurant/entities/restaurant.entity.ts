import { Field, ObjectType } from '@nestjs/graphql';
import { Order } from 'src/order/entities/order.entity';
import { SharedEntity } from 'src/shared/shared.entity';
import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  RelationId,
} from 'typeorm';
import { Category } from './catergory.entitiy';
import { Dish } from './dish.entity';

@Entity()
@ObjectType()
export class Restaurant extends SharedEntity {
  @Column({ unique: true })
  @Field(type => String)
  name: string;

  @Column({ nullable: true })
  @Field(type => String, { nullable: true })
  imageUrl?: string;

  @OneToOne(type => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  @Field(type => User)
  owner: User;

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @ManyToOne(type => Category, (category: Category) => category.restaurants, {
    onDelete: 'CASCADE',
  })
  @Field(type => Category)
  category: Category;

  @OneToMany(type => Dish, (dish: Dish) => dish.restaurant)
  @Field(type => [Dish])
  menu: Dish[];

  @OneToMany(type => Order, (order: Order) => order.restaurant)
  @Field(type => [Order])
  orders: Order[];

  @Column({ default: false })
  @Field(type => Boolean)
  isPromoted: boolean;

  @Column({ type: 'date', nullable: true })
  @Field(type => Date, { nullable: true })
  promotionExpireDate?: Date;
}
