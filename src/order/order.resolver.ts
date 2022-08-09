import { Inject } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { LoggedInUser } from 'src/auth/decorators/logged-in-user.decorator';
import { Role } from 'src/auth/decorators/role.decorator';
import { PUBSUB_TOKEN } from 'src/shared/shared.constants';
import { User, UserRole } from 'src/user/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import {
  EditOrderStatusInput,
  EditOrderStatusOutput,
} from './dtos/edit-order-status.dto';
import { OrderStatusChangedInput } from './dtos/order-status-changed.dto';
import { PickupOrderInput, PickupOrderOutput } from './dtos/pickup-order-dto';
import { SeeOrderInput, SeeOrderOutput } from './dtos/see-order.dto';
import { SeeOrdersOutput } from './dtos/see-orders.dto';
import { Order } from './entities/order.entity';
import {
  ORDER_COOKED_TRIGGER,
  ORDER_CREATED_TRIGGER,
  ORDER_STATUS_CHANGED_TRIGGER,
} from './order.constants';
import { OrderService } from './order.service';

@Resolver(of => Order)
export class OrderResolver {
  constructor(
    private readonly orderService: OrderService,
    @Inject(PUBSUB_TOKEN) private readonly pubSub: PubSub,
  ) {}

  @Role([UserRole.Customer])
  @Mutation(returns => CreateOrderOutput)
  createOrder(
    @Args('input') input: CreateOrderInput,
    @LoggedInUser() loggedInUser: User,
  ): Promise<CreateOrderOutput> {
    return this.orderService.createOrder(input, loggedInUser);
  }

  @Role(['Any'])
  @Query(returns => SeeOrdersOutput)
  seeOrders(@LoggedInUser() loggedInUser: User): Promise<SeeOrdersOutput> {
    return this.orderService.seeOrders(loggedInUser);
  }

  @Role(['Any'])
  @Query(returns => SeeOrderOutput)
  seeOrder(
    @Args('input') input: SeeOrderInput,
    @LoggedInUser() LoggedInUser: User,
  ): Promise<SeeOrderOutput> {
    return this.orderService.seeOrder(input, LoggedInUser);
  }

  @Role([UserRole.Driver, UserRole.Owner])
  @Mutation(returns => EditOrderStatusOutput)
  editOrderStatus(
    @Args('input') input: EditOrderStatusInput,
    @LoggedInUser() LoggedInUser: User,
  ): Promise<EditOrderStatusOutput> {
    return this.orderService.editOrderStatus(input, LoggedInUser);
  }

  @Role([UserRole.Driver])
  @Mutation(returns => PickupOrderOutput)
  pickupOrder(
    @Args('input') input: PickupOrderInput,
    @LoggedInUser() LoggedInUser: User,
  ): Promise<PickupOrderOutput> {
    return this.orderService.pickupOrder(input, LoggedInUser);
  }

  @Role([UserRole.Owner])
  @Subscription(returns => Order, {
    filter: (
      { orderCreated: order }: { orderCreated: Order },
      _,
      { loggedInUser }: { loggedInUser: User },
    ) => {
      return order.restaurant.id == loggedInUser.restaurantId;
    },
  })
  orderCreated() {
    return this.pubSub.asyncIterator(ORDER_CREATED_TRIGGER);
  }

  @Role(['Any'])
  @Subscription(returns => Order, {
    filter: (
      { orderStatusChanged: order }: { orderStatusChanged: Order },
      { input: { orderId } }: { input: OrderStatusChangedInput },
      { loggedInUser }: { loggedInUser: User },
    ) => {
      if (order.id != orderId) return false;
      if (loggedInUser.role == UserRole.Customer)
        return order.customerId == loggedInUser.id;
      else if (loggedInUser.role == UserRole.Driver)
        return order.driverId == loggedInUser.id;
      else if (loggedInUser.role == UserRole.Owner)
        return order.restaurant.ownerId == loggedInUser.id;
      return false;
    },
  })
  orderStatusChanged(@Args('input') input: OrderStatusChangedInput) {
    return this.pubSub.asyncIterator(ORDER_STATUS_CHANGED_TRIGGER);
  }

  @Role([UserRole.Driver])
  @Subscription(returns => Order)
  orderCooked() {
    return this.pubSub.asyncIterator(ORDER_COOKED_TRIGGER);
  }
}
