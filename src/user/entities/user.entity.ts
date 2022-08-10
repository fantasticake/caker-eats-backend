import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Order } from 'src/order/entities/order.entity';
import { Promotion } from 'src/user/entities/promotion.entity';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { SharedEntity } from 'src/shared/shared.entity';
import { Column, Entity, OneToMany, OneToOne, RelationId } from 'typeorm';

export enum UserRole {
  Customer = 'Customer',
  Owner = 'Owner',
  Driver = 'Driver',
  Admin = 'Admin',
}

registerEnumType(UserRole, { name: 'UserRole' });

@Entity()
@ObjectType()
export class User extends SharedEntity {
  @Column({ unique: true })
  @Field(type => String)
  email: string;

  @Column()
  @Field(type => String)
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(type => UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field(type => Boolean)
  verified: boolean;

  @OneToOne(type => Restaurant, (restaurant: Restaurant) => restaurant.owner, {
    nullable: true,
  })
  @Field(type => Restaurant, { nullable: true })
  restaurant?: Restaurant;

  @RelationId((user: User) => user.restaurant)
  restaurantId?: number;

  @OneToMany(type => Order, (order: Order) => order.customer)
  @Field(type => [Order])
  orders: Order[];

  @OneToMany(type => Order, (order: Order) => order.driver)
  @Field(type => [Order])
  driverOrders: Order[];

  @OneToMany(type => Promotion, (promotion: Promotion) => promotion.owner)
  @Field(type => [Promotion])
  promotions: Promotion[];
}
