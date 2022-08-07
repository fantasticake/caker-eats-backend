import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { LoggedInUser } from 'src/auth/decorators/logged-in-user.decorator';
import { Role } from 'src/auth/decorators/role.decorator';
import { User, UserRole } from 'src/user/entities/user.entity';
import { DishService } from './dish.service';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { Dish } from './entities/dish.entity';

@Resolver(of => Dish)
export class DishResolver {
  constructor(private readonly dishService: DishService) {}

  @Role([UserRole.Owner])
  @Mutation(returns => CreateDishOutput)
  createDish(
    @Args('input') input: CreateDishInput,
    @LoggedInUser() loggedInUser: User,
  ): Promise<CreateDishOutput> {
    return this.dishService.createDish(input, loggedInUser);
  }

  @Role([UserRole.Owner])
  @Mutation(returns => EditDishOutput)
  editDish(
    @Args('input') input: EditDishInput,
    @LoggedInUser() loggedInUser: User,
  ): Promise<EditDishOutput> {
    return this.dishService.editDish(input, loggedInUser);
  }

  @Role([UserRole.Owner])
  @Mutation(returns => DeleteDishOutput)
  deleteDish(
    @Args('input') input: DeleteDishInput,
    @LoggedInUser() loggedInUser: User,
  ): Promise<DeleteDishOutput> {
    return this.dishService.deleteDish(input, loggedInUser);
  }
}
