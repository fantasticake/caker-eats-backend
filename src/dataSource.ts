import { DataSource } from 'typeorm';
import { Order } from './order/entities/order.entity';
import { Category } from './restaurant/entities/catergory.entitiy';
import { Dish } from './restaurant/entities/dish.entity';
import { Restaurant } from './restaurant/entities/restaurant.entity';
import { Promotion } from './user/entities/promotion.entity';
import { User } from './user/entities/user.entity';
import { Verification } from './user/entities/verification.entity';
require('dotenv').config({ path: '.prod.env' });

export const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  migrations: ['./migrations/*.ts'],
  entities: [Order, Category, Dish, Restaurant, Promotion, User, Verification],
});
