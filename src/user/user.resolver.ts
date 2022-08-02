import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { EditUserInput, EditUserOutput } from './dtos/edit-user.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
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

  @Mutation(returns => LoginOutput)
  login(@Args('input') input: LoginInput): Promise<LoginOutput> {
    return this.userService.login(input);
  }

  @Mutation(returns => EditUserOutput)
  editUser(@Args('input') input: EditUserInput) {
    //todo
  }

  @Query(returns => SeeMeOutput)
  seeMe() {
    //todo
  }
}
