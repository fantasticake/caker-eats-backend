import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class DishService {
  constructor(
    @InjectRepository(Dish) private readonly dishesRepository: Repository<Dish>,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
  ) {}

  async createDish(
    input: CreateDishInput,
    loggedInUser: User,
  ): Promise<CreateDishOutput> {
    try {
      if (!loggedInUser.restaurantId)
        return { ok: false, error: 'Restaurant not exists.' };
      await this.dishesRepository.save(
        this.dishesRepository.create({
          ...input,
          restaurant: { id: loggedInUser.restaurantId },
        }),
      );
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot create a dish.' };
    }
  }

  async editDish(
    input: EditDishInput,
    loggedInUser: User,
  ): Promise<EditDishOutput> {
    try {
      const existingDish = await this.dishesRepository.findOneBy({
        id: input.dishId,
        restaurant: { id: loggedInUser.restaurantId },
      });
      if (!existingDish) return { ok: false, error: 'Dish not found.' };
      await this.dishesRepository.save({ id: input.dishId, ...input });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot edit dish.' };
    }
  }

  async deleteDish(
    input: DeleteDishInput,
    loggedInUser: User,
  ): Promise<DeleteDishOutput> {
    try {
      const existingDish = await this.dishesRepository.findOneBy({
        id: input.dishId,
        restaurant: { id: loggedInUser.restaurantId },
      });
      if (!existingDish) return { ok: false, error: 'Dish not found.' };
      await this.dishesRepository.delete({ id: input.dishId });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot delete dish.' };
    }
  }
}
