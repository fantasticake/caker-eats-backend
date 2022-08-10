import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LoggedInUser } from 'src/auth/decorators/logged-in-user.decorator';
import { Restaurant } from 'src/restaurant/entities/restaurant.entity';
import { Repository } from 'typeorm';
import {
  CreatePromotionInput,
  CreatePromotionOutput,
} from './dtos/create-promotion.dto';
import { SeePromotionsOutput } from './dtos/see-promotions.dto';
import { Promotion } from './entities/promotion.entity';
import { User } from './entities/user.entity';
import { PROMOTION_DAYS } from './promotion.constants';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionsRepo: Repository<Promotion>,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
  ) {}

  async createPromotion(
    input: CreatePromotionInput,
    loggedInUser: User,
  ): Promise<CreatePromotionOutput> {
    try {
      const existingRestaurant = await this.restaurantsRepo.findOneBy({
        id: loggedInUser.restaurantId,
      });
      if (!existingRestaurant)
        return { ok: false, error: 'Restaurant not found.' };

      await this.promotionsRepo.save(
        this.promotionsRepo.create({
          ...input,
          owner: { id: loggedInUser.id },
        }),
      );

      const expireDate = existingRestaurant.isPromoted
        ? new Date(existingRestaurant.promotionExpireDate)
        : new Date();
      expireDate.setDate(expireDate.getDate() + PROMOTION_DAYS),
        await this.restaurantsRepo.save({
          id: loggedInUser.restaurantId,
          isPromoted: true,
          promotionExpireDate: expireDate,
        });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot create a promotion.' };
    }
  }

  async seePromotions(loggedInUser: User): Promise<SeePromotionsOutput> {
    try {
      const promotions = await this.promotionsRepo.findBy({
        owner: { id: loggedInUser.id },
      });
      return { ok: true, result: promotions };
    } catch {
      return { ok: false, error: 'Cannot see promotions.' };
    }
  }
}
