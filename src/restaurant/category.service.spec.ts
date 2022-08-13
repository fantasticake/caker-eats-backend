import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PAGINATION_TAKE } from 'src/shared/shared.constants';
import { categoryTestData, restaurantTestData } from 'src/test/test.data';
import { Repository } from 'typeorm';
import { CategoryService } from './category.service';
import { CreateCategoryInput } from './dtos/create-category.dto';
import { DeleteCategoryInput } from './dtos/delete-category.dto';
import { SeeCategoryInput } from './dtos/see-category.dto';
import { Category } from './entities/catergory.entitiy';
import { Restaurant } from './entities/restaurant.entity';

const getMockedRepo = () => ({
  save: jest.fn(),
  create: jest.fn(),
  findOneBy: jest.fn(),
  delete: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
});

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let categoriesRepo: Record<keyof Repository<Category>, jest.Mock>;
  let restaurantsRepo: Record<keyof Repository<Restaurant>, jest.Mock>;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: getRepositoryToken(Category), useValue: getMockedRepo() },
        { provide: getRepositoryToken(Restaurant), useValue: getMockedRepo() },
      ],
    }).compile();
    categoryService = module.get(CategoryService);
    categoriesRepo = module.get(getRepositoryToken(Category));
    restaurantsRepo = module.get(getRepositoryToken(Restaurant));
  });

  it('should be defined', () => {
    expect(categoryService).toBeDefined();
  });

  describe('createCategory', () => {
    const input: CreateCategoryInput = {
      name: categoryTestData.name,
      imageUrl: categoryTestData.imageUrl,
    };
    it('should return an error if category slug exists', async () => {
      categoriesRepo.findOneBy.mockResolvedValueOnce(categoryTestData);
      const result = await categoryService.createCategory(input);
      expect(categoriesRepo.findOneBy).toBeCalledTimes(1);
      expect(categoriesRepo.findOneBy).toBeCalledWith({
        slug: categoryTestData.slug,
      });
      expect(result).toEqual({
        ok: false,
        error: 'Category slug already exists.',
      });
    });

    it('should create a category', async () => {
      categoriesRepo.findOneBy.mockResolvedValueOnce(null);
      categoriesRepo.create.mockReturnValueOnce(categoryTestData);
      const result = await categoryService.createCategory(input);
      expect(categoriesRepo.create).toBeCalledTimes(1);
      expect(categoriesRepo.create).toBeCalledWith({
        ...input,
        slug: categoryTestData.slug,
      });
      expect(categoriesRepo.save).toBeCalledTimes(1);
      expect(categoriesRepo.save).toBeCalledWith(categoryTestData);
      expect(result).toEqual({
        ok: true,
      });
    });

    it('should return an error if it fails', async () => {
      categoriesRepo.findOneBy.mockRejectedValueOnce(new Error());
      const result = await categoryService.createCategory(input);
      expect(result).toEqual({ ok: false, error: 'Cannot create a category.' });
    });
  });

  describe('deleteCategory', () => {
    const input: DeleteCategoryInput = {
      slug: categoryTestData.slug,
    };
    it('should delete a category', async () => {
      const result = await categoryService.deleteCategory(input);
      expect(categoriesRepo.delete).toBeCalledTimes(1);
      expect(categoriesRepo.delete).toBeCalledWith({ slug: input.slug });
      expect(result).toEqual({ ok: true });
    });

    it('should return an error if it fails', async () => {
      categoriesRepo.delete.mockRejectedValueOnce(new Error());
      const result = await categoryService.deleteCategory(input);
      expect(result).toEqual({ ok: false, error: 'Cannot delete category.' });
    });
  });

  describe('seeCategories', () => {
    it('should return categories', async () => {
      categoriesRepo.find.mockResolvedValueOnce([categoryTestData]);
      const result = await categoryService.seeCategories();
      expect(categoriesRepo.find).toBeCalledTimes(1);
      expect(result).toEqual({ ok: true, result: [categoryTestData] });
    });

    it('should return an error if it fails', async () => {
      categoriesRepo.find.mockRejectedValueOnce(new Error());
      const result = await categoryService.seeCategories();
      expect(result).toEqual({ ok: false, error: 'Cannot see categories.' });
    });
  });

  describe('seeCategory', () => {
    const input: SeeCategoryInput = {
      slug: categoryTestData.slug,
      page: 1,
    };
    it('should return an error if category not found', async () => {
      categoriesRepo.findOneBy.mockResolvedValueOnce(null);
      const result = await categoryService.seeCategory(input);
      expect(categoriesRepo.findOneBy).toBeCalledTimes(1);
      expect(categoriesRepo.findOneBy).toBeCalledWith({ slug: input.slug });
      expect(result).toEqual({ ok: false, error: 'Category not found.' });
    });

    it('should return category', async () => {
      categoriesRepo.findOneBy.mockResolvedValueOnce(categoryTestData);
      restaurantsRepo.findAndCount.mockResolvedValueOnce([
        [restaurantTestData],
        1,
      ]);
      const result = await categoryService.seeCategory(input);
      expect(restaurantsRepo.findAndCount).toBeCalledTimes(1);
      expect(restaurantsRepo.findAndCount).toBeCalledWith({
        where: { category: { slug: input.slug } },
        skip: (input.page - 1) * PAGINATION_TAKE,
        take: PAGINATION_TAKE,
        order: { isPromoted: 'DESC' },
      });
      expect(result).toEqual({
        ok: true,
        result: { ...categoryTestData, restaurants: [restaurantTestData] },
        totalPages: Math.ceil(1 / PAGINATION_TAKE),
      });
    });

    it('should return an error if it fails', async () => {
      categoriesRepo.findOneBy.mockRejectedValueOnce(new Error());
      const result = await categoryService.seeCategory(input);
      expect(result).toEqual({ ok: false, error: 'Cannot see category.' });
    });
  });
});
