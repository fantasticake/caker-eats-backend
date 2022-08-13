import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PAGINATION_TAKE } from 'src/shared/shared.constants';
import {
  categoryTestData,
  ownerTestData,
  restaurantTestData,
} from 'src/test/test.data';
import { ILike, Repository } from 'typeorm';
import { CreateRestaurantInput } from './dtos/create-restaurant.dto';
import { EditRestaurantInput } from './dtos/edit-restaurant.dto';
import { SearchRestaurantInput } from './dtos/search-restaurant.dto';
import { SeeRestaurantInput } from './dtos/see-restaurant.dto';
import { SeeRestaurantsInput } from './dtos/see-restaurants.dto';
import { Category } from './entities/catergory.entitiy';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurant.service';

const getMockedRepo = () => ({
  save: jest.fn(),
  create: jest.fn(),
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
});

describe('RestaurantService', () => {
  let restaurantService: RestaurantService;
  let categoriesRepo: Record<keyof Repository<Category>, jest.Mock>;
  let restaurantsRepo: Record<keyof Repository<Restaurant>, jest.Mock>;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RestaurantService,
        { provide: getRepositoryToken(Category), useValue: getMockedRepo() },
        { provide: getRepositoryToken(Restaurant), useValue: getMockedRepo() },
      ],
    }).compile();
    restaurantService = module.get(RestaurantService);
    categoriesRepo = module.get(getRepositoryToken(Category));
    restaurantsRepo = module.get(getRepositoryToken(Restaurant));
  });

  it('should be defined', () => {
    expect(restaurantService).toBeDefined();
  });

  describe('createRestaurant', () => {
    const input: CreateRestaurantInput = {
      name: restaurantTestData.name,
      categoryId: restaurantTestData.category.id,
    };
    it('should return an error if restaurant exists', async () => {
      const result = await restaurantService.createRestaurant(
        input,
        ownerTestData,
      );
      expect(result).toEqual({
        ok: false,
        error: 'Restaurant already exists.',
      });
    });

    it('should return an error if restaurant name exists', async () => {
      restaurantsRepo.findOneBy.mockResolvedValueOnce(restaurantTestData);
      const result = await restaurantService.createRestaurant(input, {
        ...ownerTestData,
        restaurantId: null,
      });
      expect(restaurantsRepo.findOneBy).toBeCalledTimes(1);
      expect(restaurantsRepo.findOneBy).toBeCalledWith({
        name: input.name,
      });
      expect(result).toEqual({
        ok: false,
        error: 'Restaurant name already exists.',
      });
    });

    it('should return an error if category not exists', async () => {
      restaurantsRepo.findOneBy.mockResolvedValueOnce(null);
      categoriesRepo.findOneBy.mockResolvedValueOnce(null);
      const result = await restaurantService.createRestaurant(input, {
        ...ownerTestData,
        restaurantId: null,
      });
      expect(categoriesRepo.findOneBy).toBeCalledTimes(1);
      expect(categoriesRepo.findOneBy).toBeCalledWith({
        id: input.categoryId,
      });
      expect(result).toEqual({ ok: false, error: 'Category does not exists.' });
    });

    it('should create a restaurant', async () => {
      restaurantsRepo.findOneBy.mockResolvedValueOnce(null);
      categoriesRepo.findOneBy.mockResolvedValueOnce(categoryTestData);
      restaurantsRepo.create.mockReturnValueOnce(restaurantTestData);
      const result = await restaurantService.createRestaurant(input, {
        ...ownerTestData,
        restaurantId: null,
      });
      expect(restaurantsRepo.create).toBeCalledTimes(1);
      expect(restaurantsRepo.create).toBeCalledWith({
        ...input,
        owner: { ...ownerTestData, restaurantId: null },
        category: categoryTestData,
      });
      expect(restaurantsRepo.save).toBeCalledTimes(1);
      expect(restaurantsRepo.save).toBeCalledWith(restaurantTestData);
      expect(result).toEqual({ ok: true });
    });

    it('should return an error if it fails', async () => {
      restaurantsRepo.findOneBy.mockRejectedValueOnce(new Error());
      const result = await restaurantService.createRestaurant(input, {
        ...ownerTestData,
        restaurantId: null,
      });
      expect(result).toEqual({
        ok: false,
        error: 'Cannot create a restaurant.',
      });
    });
  });

  describe('seeRestaurants', () => {
    const input: SeeRestaurantsInput = {
      page: 1,
    };
    it('should return restaurants', async () => {
      restaurantsRepo.findAndCount.mockResolvedValueOnce([
        [restaurantTestData],
        1,
      ]);
      const result = await restaurantService.seeRestaurants(input);
      expect(restaurantsRepo.findAndCount).toBeCalledTimes(1);
      expect(restaurantsRepo.findAndCount).toBeCalledWith({
        skip: (input.page - 1) * PAGINATION_TAKE,
        take: PAGINATION_TAKE,
        order: { isPromoted: 'DESC' },
      });
      expect(result).toEqual({
        ok: true,
        result: [restaurantTestData],
        totalPages: Math.ceil(1 / PAGINATION_TAKE),
      });
    });

    it('should return an error if it fails', async () => {
      restaurantsRepo.findAndCount.mockRejectedValueOnce(new Error());
      const result = await restaurantService.seeRestaurants(input);
      expect(result).toEqual({ ok: false, error: 'Cannot see restaurants.' });
    });
  });

  describe('seeRestaurant', () => {
    const input: SeeRestaurantInput = {
      restaurantId: restaurantTestData.id,
    };
    it('should return an error if restaurant not found', async () => {
      restaurantsRepo.findOne.mockResolvedValueOnce(null);
      const result = await restaurantService.seeRestaurant(input);
      expect(restaurantsRepo.findOne).toBeCalledTimes(1);
      expect(restaurantsRepo.findOne).toBeCalledWith({
        where: {
          id: input.restaurantId,
        },
        relations: ['menu'],
      });
      expect(result).toEqual({
        ok: false,
        error: 'Restaurant not found.',
      });
    });

    it('should return restaurant', async () => {
      restaurantsRepo.findOne.mockResolvedValueOnce(restaurantTestData);
      const result = await restaurantService.seeRestaurant(input);
      expect(result).toEqual({ ok: true, result: restaurantTestData });
    });

    it('should return an error if it fails', async () => {
      restaurantsRepo.findOne.mockRejectedValueOnce(new Error());
      const result = await restaurantService.seeRestaurant(input);
      expect(result).toEqual({ ok: false, error: 'Cannot see restaurant.' });
    });
  });

  describe('editRestaurant', () => {
    const input: EditRestaurantInput = {
      name: restaurantTestData.name,
      categoryId: restaurantTestData.category.id,
    };
    it('should return an error if restaurant not exists', async () => {
      const result = await restaurantService.editRestaurant(input, {
        ...ownerTestData,
        restaurantId: null,
      });
      expect(result).toEqual({ ok: false, error: 'Restaurant not exists.' });
    });

    it('should return an error if restaurant name exists', async () => {
      restaurantsRepo.findOneBy.mockResolvedValueOnce(restaurantTestData);
      const result = await restaurantService.editRestaurant(
        input,
        ownerTestData,
      );
      expect(restaurantsRepo.findOneBy).toBeCalledTimes(1);
      expect(restaurantsRepo.findOneBy).toBeCalledWith({
        name: input.name,
      });
      expect(result).toEqual({
        ok: false,
        error: 'Restaurant name already exists.',
      });
    });

    it('should return an error if category not exists', async () => {
      restaurantsRepo.findOneBy.mockResolvedValueOnce(null);
      categoriesRepo.findOneBy.mockResolvedValueOnce(null);
      const result = await restaurantService.editRestaurant(
        input,
        ownerTestData,
      );
      expect(categoriesRepo.findOneBy).toBeCalledTimes(1);
      expect(categoriesRepo.findOneBy).toBeCalledWith({
        id: input.categoryId,
      });
      expect(result).toEqual({ ok: false, error: 'Category not found.' });
    });

    it('should edit a restaurant', async () => {
      restaurantsRepo.findOneBy.mockResolvedValueOnce(null);
      categoriesRepo.findOneBy.mockResolvedValueOnce(categoryTestData);
      const result = await restaurantService.editRestaurant(
        input,
        ownerTestData,
      );
      expect(restaurantsRepo.save).toBeCalledTimes(1);
      expect(restaurantsRepo.save).toBeCalledWith({
        id: ownerTestData.restaurantId,
        ...input,
        ...(input.categoryId && {
          category: { id: input.categoryId },
        }),
      });
      expect(result).toEqual({ ok: true });
    });

    it('should return an error if it fails', async () => {
      restaurantsRepo.findOneBy.mockRejectedValueOnce(new Error());
      const result = await restaurantService.editRestaurant(
        input,
        ownerTestData,
      );
      expect(result).toEqual({ ok: false, error: 'Cannot edit restaurant.' });
    });
  });

  describe('deleteRestaurant', () => {
    it('should return an error if restaurant not exists', async () => {
      const result = await restaurantService.deleteRestaurant({
        ...ownerTestData,
        restaurantId: null,
      });
      expect(result).toEqual({
        ok: false,
        error: 'Restaurant does not exist.',
      });
    });

    it('should delete a restaurant', async () => {
      const result = await restaurantService.deleteRestaurant(ownerTestData);
      expect(restaurantsRepo.delete).toBeCalledTimes(1);
      expect(restaurantsRepo.delete).toBeCalledWith({
        id: ownerTestData.restaurantId,
      });
      expect(result).toEqual({
        ok: true,
      });
    });

    it('should return an error if it fails', async () => {
      restaurantsRepo.delete.mockRejectedValueOnce(new Error());
      const result = await restaurantService.deleteRestaurant(ownerTestData);
      expect(result).toEqual({ ok: false, error: 'Cannot delete restaurant.' });
    });
  });

  describe('searchRestaurant', () => {
    const input: SearchRestaurantInput = {
      key: 'key',
      page: 1,
    };
    it('should return an error if key not provided', async () => {
      const result = await restaurantService.searchRestaurant({ key: '' });
      expect(result).toEqual({ ok: false, error: 'Key must me provided' });
    });

    it('should return searched restaurants', async () => {
      restaurantsRepo.findAndCount.mockResolvedValueOnce([
        [restaurantTestData],
        1,
      ]);
      const result = await restaurantService.searchRestaurant(input);
      expect(restaurantsRepo.findAndCount).toBeCalledTimes(1);
      expect(restaurantsRepo.findAndCount).toBeCalledWith({
        where: {
          name: ILike(`%${input.key}%`),
        },
        skip: (input.page - 1) * PAGINATION_TAKE,
        take: PAGINATION_TAKE,
        order: { isPromoted: 'DESC' },
      });
      expect(result).toEqual({
        ok: true,
        result: [restaurantTestData],
        totalPages: Math.ceil(1 / PAGINATION_TAKE),
      });
    });

    it('should return an error if it fails', async () => {
      restaurantsRepo.findAndCount.mockRejectedValueOnce(new Error());
      const result = await restaurantService.searchRestaurant(input);
      expect(result).toEqual({ ok: false, error: 'Cannot search restaurant.' });
    });
  });
});
