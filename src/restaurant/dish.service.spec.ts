import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { dishTestData, ownerTestData } from 'src/test/test.data';
import { Repository } from 'typeorm';
import { DishService } from './dish.service';
import { CreateDishInput } from './dtos/create-dish.dto';
import { DeleteDishInput } from './dtos/delete-dish.dto';
import { EditDishInput } from './dtos/edit-dish.dto';
import { Dish } from './entities/dish.entity';

const getMockedRepo = () => ({
  save: jest.fn(),
  create: jest.fn(),
  findOneBy: jest.fn(),
  delete: jest.fn(),
});

describe('DishService', () => {
  let dishService: DishService;
  let dishesRepository: Record<keyof Repository<Dish>, jest.Mock>;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DishService,
        { provide: getRepositoryToken(Dish), useValue: getMockedRepo() },
      ],
    }).compile();
    dishService = module.get(DishService);
    dishesRepository = module.get(getRepositoryToken(Dish));
  });

  it('should be defined', () => {
    expect(dishService).toBeDefined();
  });

  describe('createDish', () => {
    const input: CreateDishInput = {
      name: dishTestData.name,
      price: dishTestData.price,
    };
    it('should return error if restaurant not exists', async () => {
      const result = await dishService.createDish(input, {
        ...ownerTestData,
        restaurantId: null,
      });
      expect(result).toEqual({ ok: false, error: 'Restaurant not exists.' });
    });

    it('should create a dish', async () => {
      dishesRepository.create.mockReturnValueOnce(dishTestData);
      dishesRepository.save.mockResolvedValueOnce(dishTestData);
      const result = await dishService.createDish(input, ownerTestData);
      expect(dishesRepository.create).toBeCalledTimes(1);
      expect(dishesRepository.create).toBeCalledWith({
        ...input,
        restaurant: { id: ownerTestData.restaurantId },
      });
      expect(result).toEqual({ ok: true, dishId: dishTestData.id });
    });

    it('should return error if it fails', async () => {
      dishesRepository.save.mockRejectedValueOnce(new Error());
      const result = await dishService.createDish(input, ownerTestData);
      expect(result).toEqual({ ok: false, error: 'Cannot create a dish.' });
    });
  });
  describe('editDish', () => {
    const input: EditDishInput = {
      dishId: dishTestData.id,
    };
    it('should return error if dish not found', async () => {
      dishesRepository.findOneBy.mockResolvedValueOnce(null);
      const result = await dishService.editDish(input, ownerTestData);
      expect(dishesRepository.findOneBy).toBeCalledTimes(1);
      expect(dishesRepository.findOneBy).toBeCalledWith({
        id: input.dishId,
        restaurant: { id: ownerTestData.restaurantId },
      });
      expect(result).toEqual({ ok: false, error: 'Dish not found.' });
    });

    it('should edit a dish', async () => {
      dishesRepository.findOneBy.mockResolvedValueOnce(dishTestData);
      const result = await dishService.editDish(input, ownerTestData);
      expect(dishesRepository.save).toBeCalledTimes(1);
      expect(dishesRepository.save).toBeCalledWith({
        id: input.dishId,
        ...input,
      });
      expect(result).toEqual({ ok: true });
    });

    it('should return error if it fails', async () => {
      dishesRepository.findOneBy.mockRejectedValueOnce(new Error());
      const result = await dishService.editDish(input, ownerTestData);
      expect(result).toEqual({ ok: false, error: 'Cannot edit dish.' });
    });
  });
  describe('deleteDish', () => {
    const input: DeleteDishInput = {
      dishId: dishTestData.id,
    };
    it('should return error if dish not found', async () => {
      dishesRepository.findOneBy.mockResolvedValueOnce(null);
      const result = await dishService.deleteDish(input, ownerTestData);
      expect(dishesRepository.findOneBy).toBeCalledTimes(1);
      expect(dishesRepository.findOneBy).toBeCalledWith({
        id: input.dishId,
        restaurant: { id: ownerTestData.restaurantId },
      });
      expect(result).toEqual({ ok: false, error: 'Dish not found.' });
    });

    it('should delete a dish', async () => {
      dishesRepository.findOneBy.mockResolvedValueOnce(dishTestData);
      const result = await dishService.deleteDish(input, ownerTestData);
      expect(dishesRepository.delete).toBeCalledTimes(1);
      expect(dishesRepository.delete).toBeCalledWith({ id: input.dishId });
      expect(result).toEqual({ ok: true });
    });

    it('should return error if it fails', async () => {
      dishesRepository.findOneBy.mockRejectedValueOnce(new Error());
      const result = await dishService.deleteDish(input, ownerTestData);
      expect(result).toEqual({ ok: false, error: 'Cannot delete dish.' });
    });
  });
});
