import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { SeeMeOutput } from './dtos/see-me.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Resolver(of => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Mutation(returns => CreateUserOutput)
  createUser(@Args('input') input: CreateUserInput): Promise<CreateUserOutput> {
    return this.userService.createUser(input);
  }

  @Query(returns => SeeMeOutput)
  seeMe() {
    //todo
  }
}
