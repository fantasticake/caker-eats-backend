import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { LoggedInUser } from 'src/auth/decorators/logged-in-user.decorator';
import { Role } from 'src/auth/decorators/role.decorator';
import { User, UserRole } from 'src/user/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import {
  EditOrderStatusInput,
  EditOrderStatusOutput,
} from './dtos/edit-order-status.dto';
import { SeeOrderInput, SeeOrderOutput } from './dtos/see-order.dto';
import { SeeOrdersOutput } from './dtos/see-orders.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

@Resolver(of => Order)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

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
}
