import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { SharedEntity } from 'src/shared/shared.entity';
import { User } from 'src/user/entities/user.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';

@ObjectType()
@InputType('OrderDishOptionInput', { isAbstract: true })
class OrderDishOption {
  @Field(type => String)
  name: string;
}

@ObjectType()
@InputType('OrderDishInput', { isAbstract: true })
class OrderDish {
  @Field(type => Number)
  dishId: number;

  @Field(type => Number)
  count: number;

  @Field(type => [OrderDishOption], { nullable: true })
  options?: OrderDishOption[];
}

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  Cooked = 'Cooked',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@Entity()
@ObjectType()
export class Order extends SharedEntity {
  @Column({ type: 'json' })
  @Field(type => [OrderDish])
  dishes: OrderDish[];

  @Column()
  @Field(type => String)
  location: string;

  @ManyToOne(type => User, (user: User) => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @Field(type => User, { nullable: true })
  customer?: User;

  @RelationId((order: Order) => order.customer)
  customerId: number;

  @ManyToOne(
    type => Restaurant,
    (restaurant: Restaurant) => restaurant.orders,
    { onDelete: 'SET NULL', nullable: true },
  )
  @Field(type => Restaurant, { nullable: true })
  restaurant?: Restaurant;

  @ManyToOne(type => User, (user: User) => user.driverOrders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @Field(type => User, { nullable: true })
  driver?: User;

  @RelationId((order: Order) => order.driver)
  driverId: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  @Field(type => OrderStatus, { defaultValue: OrderStatus.Pending })
  status: OrderStatus;
}
