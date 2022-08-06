import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { LoggedInUser } from 'src/auth/decorators/logged-in-user.decorator';
import { Role } from 'src/auth/decorators/role.decorator';
import { User, UserRole } from 'src/user/entities/user.entity';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import {
  SeeRestaurantInput,
  SeeRestaurantOutput,
} from './dtos/see-restaurant.dto';
import { SeeRestaurantsOutput } from './dtos/see-restaurants.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Role([UserRole.Owner])
  @Mutation(returns => CreateRestaurantOutput)
  createRestaurant(
    @Args('input') input: CreateRestaurantInput,
    @LoggedInUser() loggedInUser: User,
  ): Promise<CreateRestaurantOutput> {
    return this.restaurantService.createRestaurant(input, loggedInUser);
  }

  @Query(returns => SeeRestaurantsOutput)
  seeRestaurants(): Promise<SeeRestaurantsOutput> {
    return this.restaurantService.seeRestaurants();
  }

  @Query(returns => SeeRestaurantOutput)
  seeRestaurant(
    @Args('input') input: SeeRestaurantInput,
  ): Promise<SeeRestaurantOutput> {
    return this.restaurantService.seeRestaurant(input);
  }

  @Role([UserRole.Owner])
  @Mutation(returns => EditRestaurantOutput)
  editRestaurant(
    @Args('input') input: EditRestaurantInput,
    @LoggedInUser() loggedInUser: User,
  ): Promise<EditRestaurantOutput> {
    return this.restaurantService.editRestaurant(input, loggedInUser);
  }

  @Role([UserRole.Owner])
  @Mutation(returns => DeleteRestaurantOutput)
  deleteRestaurant(
    @LoggedInUser() loggedInUser: User,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.deleteRestaurant(loggedInUser);
  }

  @Query(returns => SearchRestaurantOutput)
  searchRestaurant(
    @Args('input') input: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    return this.restaurantService.searchRestaurant(input);
  }
}
