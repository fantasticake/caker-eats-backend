import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { Order } from './entities/order.entity';
import { OrderResolver } from './order.resolver';
import { OrderService } from './order.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Restaurant])],
  providers: [OrderResolver, OrderService],
})
export class OrderModule {}
