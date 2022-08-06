import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { SeeRestaurantsOutput } from './dtos/see-restaurants.dto';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
  ) {}
  async createRestaurant(
    input: CreateRestaurantInput,
    loggedInUser: User,
  ): Promise<CreateRestaurantOutput> {
    try {
      if (loggedInUser.restaurantId) {
        return { ok: false, error: 'Restaurant already exists.' };
      }
      const existingRestaurant = await this.restaurantsRepository.findOneBy({
        name: input.name,
      });
      if (existingRestaurant)
        return { ok: false, error: 'Restaurant name already exists.' };
      await this.restaurantsRepository.save(
        this.restaurantsRepository.create({ ...input, owner: loggedInUser }),
      );
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot create a restaurant.' };
    }
  }

  async seeRestaurants(): Promise<SeeRestaurantsOutput> {
    try {
      const restaurants = await this.restaurantsRepository.find();
      return { ok: true, result: restaurants };
    } catch {
      return { ok: false, error: 'Cannot see restaurants.' };
    }
  }

  async seeRestaurant(input: SeeRestaurantInput): Promise<SeeRestaurantOutput> {
    try {
      const restaurant = await this.restaurantsRepository.findOneBy({
        id: input.restaurantId,
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
      const existingRestaurant = await this.restaurantsRepository.findOneBy({
        name: input.name,
      });
      if (existingRestaurant)
        return {
          ok: false,
          error: 'Restaurant name already exists.',
        };
      await this.restaurantsRepository.save({
        id: loggedInUser.restaurantId,
        ...input,
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
      await this.restaurantsRepository.delete({
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
      const restaurants = await this.restaurantsRepository.findBy({
        name: ILike(`%${input.key}%`),
      });
      return { ok: true, result: restaurants };
    } catch {
      return { ok: false, error: 'Cannot search restaurant.' };
    }
  }
}
