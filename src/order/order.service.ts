import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { PUBSUB_TOKEN } from 'src/shared/shared.constants';
import { User, UserRole } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import {
  EditOrderStatusInput,
  EditOrderStatusOutput,
} from './dtos/edit-order-status.dto';
import { PickupOrderInput, PickupOrderOutput } from './dtos/pickup-order.dto';
import { SeeOrderInput, SeeOrderOutput } from './dtos/see-order.dto';
import { SeeOrdersOutput } from './dtos/see-orders.dto';
import { Order, OrderStatus } from './entities/order.entity';
import {
  ORDER_COOKED_TRIGGER,
  ORDER_CREATED_TRIGGER,
  ORDER_STATUS_CHANGED_TRIGGER,
} from './order.constants';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
    @Inject(PUBSUB_TOKEN) private readonly pubSub: PubSub,
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

      const order = await this.ordersRepo.save(
        this.ordersRepo.create({
          ...input,
          restaurant: existingRestaurant,
          customer: loggedInUser,
        }),
      );
      this.pubSub.publish(ORDER_CREATED_TRIGGER, { orderCreated: order });
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

  private canAccessOrder(order: Order, user: User): boolean {
    if (!order) return false;
    if (user.role == UserRole.Customer) return order.customerId == user.id;
    else if (user.role == UserRole.Driver) return order.driverId == user.id;
    else if (user.role == UserRole.Owner)
      return order.restaurant.ownerId == user.id;
    return false;
  }

  async seeOrder(
    input: SeeOrderInput,
    loggedInUser: User,
  ): Promise<SeeOrderOutput> {
    try {
      const existingOrder = await this.ordersRepo.findOne({
        where: {
          id: input.orderId,
        },
        relations: ['restaurant', 'driver', 'customer'],
      });
      if (!existingOrder) return { ok: false, error: 'Order not found.' };

      const canAccess = this.canAccessOrder(existingOrder, loggedInUser);
      if (!canAccess) return { ok: false, error: 'Cannot access an order.' };

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
      const existingOrder = await this.ordersRepo.findOne({
        where: {
          id: input.orderId,
        },
        relations: ['restaurant'],
      });
      if (!existingOrder) return { ok: false, error: 'Order not found.' };

      const canAccess = this.canAccessOrder(existingOrder, loggedInUser);
      if (!canAccess) return { ok: false, error: 'Cannot access an order.' };

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

      existingOrder.status == input.status;
      const newOrder = await this.ordersRepo.save(existingOrder);

      this.pubSub.publish(ORDER_STATUS_CHANGED_TRIGGER, {
        orderStatusChanged: newOrder,
      });
      if (input.status == OrderStatus.Cooked)
        this.pubSub.publish(ORDER_COOKED_TRIGGER, {
          orderCooked: newOrder,
        });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot edit an order status.' };
    }
  }

  async pickupOrder(
    input: PickupOrderInput,
    loggedInUser: User,
  ): Promise<PickupOrderOutput> {
    try {
      const existingOrder = await this.ordersRepo.findOneBy({
        id: input.orderId,
      });
      if (!existingOrder || existingOrder.driverId)
        return { ok: false, error: 'Order not found.' };

      existingOrder.driver = loggedInUser;
      existingOrder.status = OrderStatus.PickedUp;
      await this.ordersRepo.save(existingOrder);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot pickup an order.' };
    }
  }
}