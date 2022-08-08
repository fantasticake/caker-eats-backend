import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { User, UserRole } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import {
  EditOrderStatusInput,
  EditOrderStatusOutput,
} from './dtos/edit-order-status.dto';
import { SeeOrderInput, SeeOrderOutput } from './dtos/see-order.dto';
import { SeeOrdersOutput } from './dtos/see-orders.dto';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
  ) {}

  async createOrder(
    input: CreateOrderInput,
    loggedInUser: User,
  ): Promise<CreateOrderOutput> {
    try {
      const existingRestaurant = await this.restaurantsRepo.findOne({
        where: { id: input.restaurantId },
        relations: ['menu'],
      });
      if (!existingRestaurant)
        return { ok: false, error: 'Restaurant not found.' };

      const menu = existingRestaurant.menu;
      for (const orderDish of input.dishes) {
        const existingDish = menu.find(
          menuDish => menuDish.id == orderDish.dishId,
        );
        if (!existingDish) return { ok: false, error: 'Dish not found.' };
        for (const orderDishOption of orderDish.options) {
          const existingDishOption = existingDish.options.find(
            dishOption => dishOption.name == orderDishOption.name,
          );
          if (!existingDishOption)
            return { ok: false, error: 'Dish option not found.' };
        }
      }

      await this.ordersRepo.save(
        this.ordersRepo.create({
          ...input,
          restaurant: existingRestaurant,
          customer: loggedInUser,
        }),
      );
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot create an order.' };
    }
  }

  async seeOrders(loggedInUser: User): Promise<SeeOrdersOutput> {
    try {
      let result: Order[];
      if (loggedInUser.role == UserRole.Customer) {
        result = await this.ordersRepo.findBy({
          customer: { id: loggedInUser.id },
        });
      } else if (loggedInUser.role == UserRole.Driver) {
        result = await this.ordersRepo.findBy({
          driver: { id: loggedInUser.id },
        });
      } else if (loggedInUser.role == UserRole.Owner) {
        result = await this.ordersRepo.findBy({
          restaurant: { owner: { id: loggedInUser.id } },
        });
      }
      return { ok: true, result };
    } catch (error) {
      console.log(error);
      return { ok: false, error: 'Cannot see orders.' };
    }
  }

  private async getExistingOrder(orderId: number, user: User): Promise<Order> {
    let existingOrder: Order;
    if (user.role == UserRole.Customer)
      existingOrder = await this.ordersRepo.findOneBy({
        id: orderId,
        customer: { id: user.id },
      });
    else if (user.role == UserRole.Driver)
      existingOrder = await this.ordersRepo.findOneBy({
        id: orderId,
        driver: { id: user.id },
      });
    else if (user.role == UserRole.Owner)
      existingOrder = await this.ordersRepo.findOneBy({
        id: orderId,
        restaurant: { owner: { id: user.id } },
      });
    return existingOrder;
  }

  async seeOrder(
    input: SeeOrderInput,
    loggedInUser: User,
  ): Promise<SeeOrderOutput> {
    try {
      const existingOrder = await this.getExistingOrder(
        input.orderId,
        loggedInUser,
      );
      if (!existingOrder) return { ok: false, error: 'Order not found.' };
      return { ok: true, result: existingOrder };
    } catch {
      return { ok: false, error: 'Cannot see an order.' };
    }
  }

  async editOrderStatus(
    input: EditOrderStatusInput,
    loggedInUser: User,
  ): Promise<EditOrderStatusOutput> {
    try {
      const existingOrder = await this.getExistingOrder(
        input.orderId,
        loggedInUser,
      );
      if (!existingOrder) return { ok: false, error: 'Order not found.' };

      let allowed: boolean = false;
      if (loggedInUser.role == UserRole.Driver) {
        if (
          input.status == OrderStatus.PickedUp ||
          input.status == OrderStatus.Delivered
        ) {
          allowed = true;
        }
      } else if (loggedInUser.role == UserRole.Owner) {
        if (
          input.status == OrderStatus.Cooking ||
          input.status == OrderStatus.Cooked
        ) {
          allowed = true;
        }
      }
      if (!allowed)
        return { ok: false, error: 'Not allowed to edit order status.' };

      await this.ordersRepo.save({ id: input.orderId, status: input.status });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot edit an order status.' };
    }
  }
}
