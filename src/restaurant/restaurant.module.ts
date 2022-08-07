import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryResolver } from './category.resolver';
import { CategoryService } from './category.service';
import { DishResolver } from './dish.resolver';
import { DishService } from './dish.service';
import { Category } from './entities/catergory.entitiy';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantResolver } from './restaurant.resolver';
import { RestaurantService } from './restaurant.service';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category, Dish])],
  providers: [
    RestaurantResolver,
    RestaurantService,
    CategoryResolver,
    CategoryService,
    DishResolver,
    DishService,
  ],
})
export class RestaurantModule {}
