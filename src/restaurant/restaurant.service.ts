import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PAGINATION_TAKE } from 'src/shared/shared.constants';
import { User } from 'src/user/entities/user.entity';
import { ILike, Repository } from 'typeorm';
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
import {
  SeeRestaurantsInput,
  SeeRestaurantsOutput,
} from './dtos/see-restaurants.dto';
import { Category } from './entities/catergory.entitiy';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  async createRestaurant(
    input: CreateRestaurantInput,
    loggedInUser: User,
  ): Promise<CreateRestaurantOutput> {
    try {
      if (loggedInUser.restaurantId) {
        return { ok: false, error: 'Restaurant already exists.' };
      }

      const existingRestaurant = await this.restaurantsRepo.findOneBy({
        name: input.name,
      });
      if (existingRestaurant)
        return { ok: false, error: 'Restaurant name already exists.' };

      const existingCategory = await this.categoriesRepo.findOneBy({
        slug: input.categorySlug,
      });
      if (!existingCategory)
        return { ok: false, error: 'Category does not exists.' };

      const restaurant = await this.restaurantsRepo.save(
        this.restaurantsRepo.create({
          ...input,
          owner: loggedInUser,
          category: existingCategory,
        }),
      );
      return { ok: true, restaurantId: restaurant.id };
    } catch (error) {
      console.log(error);
      return { ok: false, error: 'Cannot create a restaurant.' };
    }
  }

  async seeRestaurants(
    input: SeeRestaurantsInput,
  ): Promise<SeeRestaurantsOutput> {
    try {
      const [restaurants, totalRestaurants] =
        await this.restaurantsRepo.findAndCount({
          skip: (input.page - 1) * PAGINATION_TAKE,
          take: PAGINATION_TAKE,
          order: { isPromoted: 'DESC' },
        });
      return {
        ok: true,
        result: restaurants,
        totalPages: Math.ceil(totalRestaurants / PAGINATION_TAKE),
      };
    } catch {
      return { ok: false, error: 'Cannot see restaurants.' };
    }
  }

  async seeRestaurant(input: SeeRestaurantInput): Promise<SeeRestaurantOutput> {
    try {
      const restaurant = await this.restaurantsRepo.findOne({
        where: {
          id: input.restaurantId,
        },
        relations: ['menu'],
      });
      if (!restaurant)
        return {
          ok: false,
          error: 'Restaurant not found.',
        };
      return { ok: true, result: restaurant };
    } catch {
      return { ok: false, error: 'Cannot see restaurant.' };
    }
  }

  async editRestaurant(
    input: EditRestaurantInput,
    loggedInUser: User,
  ): Promise<EditRestaurantOutput> {
    try {
      if (!loggedInUser.restaurantId) {
        return { ok: false, error: 'Restaurant not exists.' };
      }
      if (input.name) {
        const existingRestaurant = await this.restaurantsRepo.findOneBy({
          name: input.name,
        });
        if (existingRestaurant)
          return {
            ok: false,
            error: 'Restaurant name already exists.',
          };
      }
      if (input.categorySlug) {
        const existingCategory = await this.categoriesRepo.findOneBy({
          slug: input.categorySlug,
        });
        if (!existingCategory)
          return { ok: false, error: 'Category not found.' };
      }
      await this.restaurantsRepo.save({
        id: loggedInUser.restaurantId,
        ...input,
        ...(input.categorySlug && {
          category: { slug: input.categorySlug },
        }),
      });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot edit restaurant.' };
    }
  }

  async deleteRestaurant(loggedInUser: User): Promise<DeleteRestaurantOutput> {
    try {
      if (!loggedInUser.restaurantId)
        return {
          ok: false,
          error: 'Restaurant does not exist.',
        };
      await this.restaurantsRepo.delete({
        id: loggedInUser.restaurantId,
      });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot delete restaurant.' };
    }
  }

  async searchRestaurant(
    input: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    try {
      if (!input.key) return { ok: false, error: 'Key must me provided' };
      const [restaurants, totalRestaurants] =
        await this.restaurantsRepo.findAndCount({
          where: {
            name: ILike(`%${input.key}%`),
          },
          skip: (input.page - 1) * PAGINATION_TAKE,
          take: PAGINATION_TAKE,
          order: { isPromoted: 'DESC' },
        });
      return {
        ok: true,
        result: restaurants,
        totalPages: Math.ceil(totalRestaurants / PAGINATION_TAKE),
      };
    } catch {
      return { ok: false, error: 'Cannot search restaurant.' };
    }
  }
}
