import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Role } from 'src/auth/decorators/role.decorator';
import { UserRole } from 'src/user/entities/user.entity';
import { CategoryService } from './category.service';
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

@Resolver(of => Category)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Role([UserRole.Admin])
  @Mutation(returns => CreateCategoryOutput)
  createCategory(
    @Args('input') input: CreateCategoryInput,
  ): Promise<CreateCategoryOutput> {
    return this.categoryService.createCategory(input);
  }

  @Role([UserRole.Admin])
  @Mutation(returns => DeleteCategoryOutput)
  deleteCategory(
    @Args('input') input: DeleteCategoryInput,
  ): Promise<DeleteCategoryOutput> {
    return this.categoryService.deleteCategory(input);
  }

  @Query(returns => SeeCategoriesOutput)
  seeCategories(): Promise<SeeCategoriesOutput> {
    return this.categoryService.seeCategories();
  }

  @Query(returns => SeeCategoryOutput)
  seeCategory(
    @Args('input') input: SeeCategoryInput,
  ): Promise<SeeCategoryOutput> {
    return this.categoryService.seeCategory(input);
  }
}
