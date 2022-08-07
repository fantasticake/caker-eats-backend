import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PAGINATION_TAKE } from 'src/shared/shared.constants';
import { Repository } from 'typeorm';
import {
  CreateCategoryInput,
  CreateCategoryOutput,
} from './dtos/create-category.dto';
import {
  DeleteCategoryInput,
  DeleteCategoryOutput,
} from './dtos/delete-category.dto';
import { SeeCategoriesOutput } from './dtos/see-categories.dto';
import { SeeCategoryInput, SeeCategoryOutput } from './dtos/see-category.dto';
import { Category } from './entities/catergory.entitiy';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepository: Repository<Restaurant>,
  ) {}

  async createCategory(
    input: CreateCategoryInput,
  ): Promise<CreateCategoryOutput> {
    try {
      const slug = input.name.trim().toLowerCase().replaceAll(/\s+/g, '-');
      const existingCategory = await this.categoriesRepository.findOneBy({
        slug,
      });
      if (existingCategory)
        return { ok: false, error: 'Category slug already exists.' };
      await this.categoriesRepository.save(
        this.categoriesRepository.create({ ...input, slug }),
      );
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot create a category.' };
    }
  }

  async deleteCategory(
    input: DeleteCategoryInput,
  ): Promise<DeleteCategoryOutput> {
    try {
      await this.categoriesRepository.delete({ slug: input.slug });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Cannot delete category.' };
    }
  }

  async seeCategories(): Promise<SeeCategoriesOutput> {
    try {
      const categories = await this.categoriesRepository.find();
      return { ok: true, result: categories };
    } catch {
      return { ok: false, error: 'Cannot see categories.' };
    }
  }

  async seeCategory(input: SeeCategoryInput): Promise<SeeCategoryOutput> {
    const category = await this.categoriesRepository.findOneBy({
      slug: input.slug,
    });
    if (!category) {
      return { ok: false, error: 'Category not found.' };
    }
    const [restaurants, totalRestaurants] =
      await this.restaurantsRepository.findAndCount({
        where: { category: { slug: input.slug } },
        skip: (input.page - 1) * PAGINATION_TAKE,
        take: PAGINATION_TAKE,
      });
    return {
      ok: true,
      result: { ...category, restaurants },
      totalPages: Math.ceil(totalRestaurants / PAGINATION_TAKE),
    };
  }
}