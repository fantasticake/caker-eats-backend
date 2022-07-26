import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { LoggedInUser } from 'src/auth/decorators/logged-in-user.decorator';
import { Role } from 'src/auth/decorators/role.decorator';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { DeleteUserOutput } from './dtos/delete-user.dto';
import { EditUserInput, EditUserOutput } from './dtos/edit-user.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { SeeMeOutput } from './dtos/see-me.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Resolver(of => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Mutation(returns => CreateUserOutput)
  createUser(@Args('input') input: CreateUserInput): Promise<CreateUserOutput> {
    return this.userService.createUser(input);
  }

  @Role(['Any'])
  @Mutation(returns => EditUserOutput)
  editUser(
    @Args('input') input: EditUserInput,
    @LoggedInUser() loggedInUser: User,
  ): Promise<EditUserOutput> {
    return this.userService.editUser(input, loggedInUser);
  }

  @Role(['Any'])
  @Mutation(returns => DeleteUserOutput)
  deleteUser(@LoggedInUser() loggedInUser: User): Promise<DeleteUserOutput> {
    return this.userService.deleteUser(loggedInUser);
  }

  @Mutation(returns => LoginOutput)
  login(@Args('input') input: LoginInput): Promise<LoginOutput> {
    return this.userService.login(input);
  }

  @Role(['Any'])
  @Query(returns => SeeMeOutput)
  seeMe(@LoggedInUser() loggedInUser: User): SeeMeOutput {
    return { ok: true, result: loggedInUser };
  }

  @Role(['Any'])
  @Mutation(returns => VerifyEmailOutput)
  verifyEmail(
    @Args('input') input: VerifyEmailInput,
    @LoggedInUser() loggedInUser: User,
  ): Promise<VerifyEmailOutput> {
    return this.userService.verifyEmail(input, loggedInUser);
  }
}
