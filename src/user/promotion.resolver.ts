import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { LoggedInUser } from 'src/auth/decorators/logged-in-user.decorator';
import { Role } from 'src/auth/decorators/role.decorator';
import { User, UserRole } from 'src/user/entities/user.entity';
import {
  CreatePromotionInput,
  CreatePromotionOutput,
} from './dtos/create-promotion.dto';
import { SeePromotionsOutput } from './dtos/see-promotions.dto';
import { Promotion } from './entities/promotion.entity';
import { PromotionService } from './promotion.service';

@Resolver(of => Promotion)
export class PromotionResolver {
  constructor(private readonly promotionService: PromotionService) {}

  @Role([UserRole.Owner])
  @Mutation(returns => CreatePromotionOutput)
  createPromotion(
    @Args('input') input: CreatePromotionInput,
    @LoggedInUser() loggedInUser: User,
  ): Promise<CreatePromotionOutput> {
    return this.promotionService.createPromotion(input, loggedInUser);
  }

  @Role([UserRole.Owner])
  @Query(returns => SeePromotionsOutput)
  seePromotions(
    @LoggedInUser() loggedInUser: User,
  ): Promise<SeePromotionsOutput> {
    return this.promotionService.seePromotions(loggedInUser);
  }
}
