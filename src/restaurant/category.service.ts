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
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
  ) {}

  async createCategory(
    input: CreateCategoryInput,
  ): Promise<CreateCategoryOutput> {
    try {
      const slug = input.name.trim().toLowerCase().replace(/\s+/g, '-');
      const existingCategory = await this.categoriesRepo.findOneBy({
        slug,
      });
      if (existingCategory)
        return { ok: false, error: 'Category slug already exists.' };
      await this.categoriesRepo.save(
        this.categoriesRepo.create({ ...input, slug }),
      );
      return { ok: true };
    } catch (e) {
      console.log(e);
      return { ok: false, error: 'Cannot create a category.' };
    }
  }

  async deleteCategory(
    input: DeleteCategoryInput,
  ): Promise<DeleteCategoryOutput> {
    try {
      await this.categoriesRepo.delete({ slug: input.slug });
      return { ok: true };
    } catch (e) {
      console.log(e);
      return { ok: false, error: 'Cannot delete category.' };
    }
  }

  async seeCategories(): Promise<SeeCategoriesOutput> {
    try {
      const categories = await this.categoriesRepo.find();
      return { ok: true, result: categories };
    } catch (e) {
      console.log(e);
      return { ok: false, error: 'Cannot see categories.' };
    }
  }

  async seeCategory(input: SeeCategoryInput): Promise<SeeCategoryOutput> {
    try {
      const category = await this.categoriesRepo.findOneBy({
        slug: input.slug,
      });
      if (!category) {
        return { ok: false, error: 'Category not found.' };
      }
      const [restaurants, totalRestaurants] =
        await this.restaurantsRepo.findAndCount({
          where: { category: { slug: input.slug } },
          skip: (input.page - 1) * PAGINATION_TAKE,
          take: PAGINATION_TAKE,
          order: { isPromoted: 'DESC' },
        });
      return {
        ok: true,
        result: { ...category, restaurants },
        totalPages: Math.ceil(totalRestaurants / PAGINATION_TAKE),
      };
    } catch (e) {
      console.log(e);
      return { ok: false, error: 'Cannot see category.' };
    }
  }
}
