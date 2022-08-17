import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import { CategoryService } from 'src/restaurant/category.service';
import { RestaurantService } from 'src/restaurant/restaurant.service';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';
import {
  adminE2E,
  categoryE2E,
  customerE2E,
  dishE2E,
  editedDishE2E,
  editedRestaurantE2E,
  owner2E2E,
  ownerE2E,
  restaurantE2E,
} from './shared/data-e2e';
import { gqlTest } from './shared/utils-e2e';

describe('Restaurant Module (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;
  let categoryService: CategoryService;
  let restaurantService: RestaurantService;
  let usersRepo: Repository<User>;

  let adminToken: string;
  let customerToken: string;
  let ownerToken: string;
  let owner2Token: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    userService = module.get(UserService);
    categoryService = module.get(CategoryService);
    restaurantService = module.get(RestaurantService);
    usersRepo = module.get(getRepositoryToken(User));

    await app.init();
  });

  afterAll(async () => {
    app.close();
  });

  describe('category', () => {
    beforeAll(async () => {
      await userService.createUser(adminE2E);
      const result = await userService.login({
        email: adminE2E.email,
        password: adminE2E.password,
      });
      adminToken = result.token;
    });
    describe('createCategory', () => {
      it('should return an error if not admin', () => {
        return gqlTest(
          app,
          `
        mutation {
          createCategory(input:{
            name:"${categoryE2E.name}",
            imageUrl:"${categoryE2E.imageUrl}"
          }) {
            ok
            error
          }
        }
    `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should create category', () => {
        return gqlTest(
          app,
          `
        mutation {
          createCategory(input:{
            name:"${categoryE2E.name}",
            imageUrl:"${categoryE2E.imageUrl}"
          }) {
            ok
            error
          }
        }
    `,
          adminToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createCategory.ok).toEqual(true);
            expect(res.body.data.createCategory.error).toEqual(null);
          });
      });

      it('should return an error if slug already exists', () => {
        return gqlTest(
          app,
          `
        mutation {
          createCategory(input:{
            name:"${categoryE2E.name}",
            imageUrl:"${categoryE2E.imageUrl}"
          }) {
            ok
            error
          }
        }
    `,
          adminToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createCategory.ok).toEqual(false);
            expect(res.body.data.createCategory.error).toEqual(
              'Category slug already exists.',
            );
          });
      });
    });

    describe('seeCategories', () => {
      it('should return categories', () => {
        return gqlTest(
          app,
          `
          {
            seeCategories {
              ok
              result {
                name
              }
              error
            }
          }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeCategories.ok).toEqual(true);
            expect(res.body.data.seeCategories.result).toEqual([
              { name: categoryE2E.name },
            ]);
            expect(res.body.data.seeCategories.error).toEqual(null);
          });
      });
    });

    describe('seeCategory', () => {
      it('should return an error if slug not found', () => {
        return gqlTest(
          app,
          `
          {
            seeCategory(input:{
              slug:"invalid-slug"
            }) {
              ok
              result {
                name
              }
              error
            }
          }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeCategory.ok).toEqual(false);
            expect(res.body.data.seeCategory.result).toEqual(null);
            expect(res.body.data.seeCategory.error).toEqual(
              'Category not found.',
            );
          });
      });

      it('should return category', () => {
        return gqlTest(
          app,
          `
          {
            seeCategory(input:{
              slug:"${categoryE2E.slug}"
            }) {
              ok
              result {
                name
              }
              error
            }
          }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeCategory.ok).toEqual(true);
            expect(res.body.data.seeCategory.result).toEqual({
              name: categoryE2E.name,
            });
            expect(res.body.data.seeCategory.error).toEqual(null);
          });
      });
    });

    describe('deleteCategory', () => {
      it('should return an error if not admin', () => {
        return gqlTest(
          app,
          `
          mutation {
            deleteCategory(input:{
              slug:"${categoryE2E.slug}"
            }) {
              ok
              error
            }
          }
      `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should delete category', () => {
        return gqlTest(
          app,
          `
          mutation {
            deleteCategory(input:{
              slug:"${categoryE2E.slug}"
            }) {
              ok
              error
            }
          }
      `,
          adminToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteCategory.ok).toEqual(true);
            expect(res.body.data.deleteCategory.error).toEqual(null);
          });
      });
    });
  });

  describe('restaurant', () => {
    let restaurantId: number;

    beforeAll(async () => {
      await categoryService.createCategory({
        name: categoryE2E.name,
        imageUrl: categoryE2E.imageUrl,
      });

      await userService.createUser(customerE2E);
      await userService.createUser(ownerE2E);
      await userService.createUser(owner2E2E);
      ({ token: customerToken } = await userService.login({
        email: customerE2E.email,
        password: customerE2E.password,
      }));
      ({ token: ownerToken } = await userService.login({
        email: ownerE2E.email,
        password: ownerE2E.password,
      }));
      ({ token: owner2Token } = await userService.login({
        email: owner2E2E.email,
        password: owner2E2E.password,
      }));
    });

    describe('createRestaurant', () => {
      it('should return an error if role is not owner', () => {
        return gqlTest(
          app,
          `
        mutation {
          createRestaurant(input:{
            name:"${restaurantE2E.name}",
            categorySlug:"${restaurantE2E.categorySlug}"
          }) {
            ok
            error
          }
        }
        `,
          customerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return error if category not exists', () => {
        return gqlTest(
          app,
          `
        mutation {
          createRestaurant(input:{
            name:"${restaurantE2E.name}",
            categorySlug:"invalid-category-slug"
          }) {
            ok
            error
          }
        }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createRestaurant.ok).toEqual(false);
            expect(res.body.data.createRestaurant.error).toEqual(
              'Category does not exists.',
            );
          });
      });

      it('should create restaurant', () => {
        return gqlTest(
          app,
          `
        mutation {
          createRestaurant(input:{
            name:"${restaurantE2E.name}",
            categorySlug:"${restaurantE2E.categorySlug}"
          }) {
            ok
            error
          }
        }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createRestaurant.ok).toEqual(true);
            expect(res.body.data.createRestaurant.error).toEqual(null);
          });
      });

      it('should return error if restaurant already exists', () => {
        return gqlTest(
          app,
          `
        mutation {
          createRestaurant(input:{
            name:"${restaurantE2E.name}",
            categorySlug:"${restaurantE2E.categorySlug}"
          }) {
            ok
            error
          }
        }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createRestaurant.ok).toEqual(false);
            expect(res.body.data.createRestaurant.error).toEqual(
              'Restaurant already exists.',
            );
          });
      });

      it('should return error if restaurant name already exists', () => {
        return gqlTest(
          app,
          `
        mutation {
          createRestaurant(input:{
            name:"${restaurantE2E.name}",
            categorySlug:"${restaurantE2E.categorySlug}"
          }) {
            ok
            error
          }
        }
        `,
          owner2Token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createRestaurant.ok).toEqual(false);
            expect(res.body.data.createRestaurant.error).toEqual(
              'Restaurant name already exists.',
            );
          });
      });
    });

    describe('seeRestaurants', () => {
      it('should return restaurants', () => {
        return gqlTest(
          app,
          `
        {
          seeRestaurants(input:{
            page:1
          }) {
            ok
            error
            result {
              id
              name
            }
          }
        }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeRestaurants.ok).toEqual(true);
            expect(res.body.data.seeRestaurants.error).toEqual(null);
            expect(res.body.data.seeRestaurants.result).toEqual(
              expect.arrayContaining([
                { id: expect.any(Number), name: restaurantE2E.name },
              ]),
            );
            restaurantId = res.body.data.seeRestaurants.result[0].id;
          });
      });
    });

    describe('seeRestaurant', () => {
      it('should return error if restaurant not found', () => {
        return gqlTest(
          app,
          `
        {
          seeRestaurant(input:{
            restaurantId:999
          }) {
            ok
            error
            result {
              id
              name
            }
          }
        }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeRestaurant.ok).toEqual(false);
            expect(res.body.data.seeRestaurant.error).toEqual(
              'Restaurant not found.',
            );
            expect(res.body.data.seeRestaurant.result).toEqual(null);
          });
      });

      it('should return restaurant', () => {
        return gqlTest(
          app,
          `
        {
          seeRestaurant(input:{
            restaurantId:${restaurantId}
          }) {
            ok
            error
            result {
              id
              name
            }
          }
        }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeRestaurant.ok).toEqual(true);
            expect(res.body.data.seeRestaurant.error).toEqual(null);
            expect(res.body.data.seeRestaurant.result).toEqual({
              id: restaurantId,
              name: restaurantE2E.name,
            });
          });
      });
    });

    describe('editRestaurant', () => {
      it('should return an error if role is not owner', () => {
        return gqlTest(
          app,
          `
          mutation {
            editRestaurant(input:{
              name:"${editedRestaurantE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          customerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return error if restaurant not exists', () => {
        return gqlTest(
          app,
          `
          mutation {
            editRestaurant(input:{
              name:"${editedRestaurantE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          owner2Token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.editRestaurant.ok).toEqual(false);
            expect(res.body.data.editRestaurant.error).toEqual(
              'Restaurant not exists.',
            );
          });
      });

      it('should return error if restaurant name already exists', () => {
        return gqlTest(
          app,
          `
          mutation {
            editRestaurant(input:{
              name:"${restaurantE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.editRestaurant.ok).toEqual(false);
            expect(res.body.data.editRestaurant.error).toEqual(
              'Restaurant name already exists.',
            );
          });
      });

      it('should return error if category not exists', () => {
        return gqlTest(
          app,
          `
          mutation {
            editRestaurant(input:{
              name:"${editedRestaurantE2E.name}",
              categorySlug:"invalid-slug"
            }) {
              ok
              error
            }
          }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.editRestaurant.ok).toEqual(false);
            expect(res.body.data.editRestaurant.error).toEqual(
              'Category not found.',
            );
          });
      });

      it('should edit restaurant', () => {
        return gqlTest(
          app,
          `
          mutation {
            editRestaurant(input:{
              name:"${editedRestaurantE2E.name}",
            }) {
              ok
              error
            }
          }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.editRestaurant.ok).toEqual(true);
            expect(res.body.data.editRestaurant.error).toEqual(null);
          });
      });
    });

    describe('searchRestaurant', () => {
      it('should return error if key not provided', () => {
        return gqlTest(
          app,
          `
        {
          searchRestaurant(input:{
            key:""
          }) {
            ok
            error
            result {
              name
            }
          }
        }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.searchRestaurant.ok).toEqual(false);
            expect(res.body.data.searchRestaurant.error).toEqual(
              'Key must me provided',
            );
            expect(res.body.data.searchRestaurant.result).toEqual(null);
          });
      });

      it('should return searched restaurants', () => {
        return gqlTest(
          app,
          `
        {
          searchRestaurant(input:{
            key:"${editedRestaurantE2E.name}"
          }) {
            ok
            error
            result {
              name
            }
          }
        }
        `,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.searchRestaurant.ok).toEqual(true);
            expect(res.body.data.searchRestaurant.error).toEqual(null);
            expect(res.body.data.searchRestaurant.result).toEqual(
              expect.arrayContaining([{ name: editedRestaurantE2E.name }]),
            );
          });
      });
    });

    describe('deleteRestaurant', () => {
      it('should return an error if role is not owner', () => {
        return gqlTest(
          app,
          `
        mutation {
          deleteRestaurant {
            ok
            error
          }
        }
        `,
          customerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should delete restaurant', () => {
        return gqlTest(
          app,
          `
        mutation {
          deleteRestaurant {
            ok
            error
          }
        }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteRestaurant.ok).toEqual(true);
            expect(res.body.data.deleteRestaurant.error).toEqual(null);
          });
      });

      it('should return error if restaurant not exists', () => {
        return gqlTest(
          app,
          `
        mutation {
          deleteRestaurant {
            ok
            error
          }
        }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteRestaurant.ok).toEqual(false);
            expect(res.body.data.deleteRestaurant.error).toEqual(
              'Restaurant does not exist.',
            );
          });
      });
    });
  });

  describe('dish', () => {
    let dishId: number;

    beforeAll(async () => {
      const createdOwner = await usersRepo.findOneBy({ email: ownerE2E.email });
      await categoryService.createCategory({
        name: categoryE2E.name,
        imageUrl: categoryE2E.imageUrl,
      });
      await restaurantService.createRestaurant(
        { name: restaurantE2E.name, categorySlug: restaurantE2E.categorySlug },
        createdOwner,
      );
    });

    describe('createDish', () => {
      it('should return an error if role is not owner', () => {
        return gqlTest(
          app,
          `
        mutation {
          createDish(input:{
            name:"${dishE2E.name}",
            price:${dishE2E.price}
          }) {
            ok
            error
            dishId
          }
        }
        `,
          customerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return an error if restaurant not exists', () => {
        return gqlTest(
          app,
          `
        mutation {
          createDish(input:{
            name:"${dishE2E.name}",
            price:${dishE2E.price}
          }) {
            ok
            error
            dishId
          }
        }
        `,
          owner2Token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createDish.ok).toEqual(false);
            expect(res.body.data.createDish.error).toEqual(
              'Restaurant not exists.',
            );
          });
      });

      it('should create dish', () => {
        return gqlTest(
          app,
          `
        mutation {
          createDish(input:{
            name:"${dishE2E.name}",
            price:${dishE2E.price}
          }) {
            ok
            error
            dishId
          }
        }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.createDish.ok).toEqual(true);
            expect(res.body.data.createDish.error).toEqual(null);
            expect(res.body.data.createDish.dishId).toEqual(expect.any(Number));
            dishId = res.body.data.createDish.dishId;
          });
      });
    });

    describe('editDish', () => {
      it('should return an error if role is not owner', () => {
        return gqlTest(
          app,
          `
          mutation {
            editDish(input:{
              dishId:${dishId},
              name:"${editedDishE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          customerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return an error if restaurant not exists', () => {
        return gqlTest(
          app,
          `
          mutation {
            editDish(input:{
              dishId:${dishId},
              name:"${editedDishE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          owner2Token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.editDish.ok).toEqual(false);
            expect(res.body.data.editDish.error).toEqual(
              'Restaurant not exists.',
            );
          });
      });

      it('should return an error if dish not exists', () => {
        return gqlTest(
          app,
          `
          mutation {
            editDish(input:{
              dishId:999,
              name:"${editedDishE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.editDish.ok).toEqual(false);
            expect(res.body.data.editDish.error).toEqual('Dish not found.');
          });
      });

      it('should edit dish', () => {
        return gqlTest(
          app,
          `
          mutation {
            editDish(input:{
              dishId:${dishId},
              name:"${editedDishE2E.name}"
            }) {
              ok
              error
            }
          }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.editDish.ok).toEqual(true);
            expect(res.body.data.editDish.error).toEqual(null);
          });
      });
    });

    describe('deleteDish', () => {
      it('should return an error if role is not owner', () => {
        return gqlTest(
          app,
          `
          mutation {
            deleteDish(input:{
              dishId:${dishId}
            }) {
              ok
              error
            }
          }
        `,
          customerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return an error if restaurant not exists', () => {
        return gqlTest(
          app,
          `
          mutation {
            deleteDish(input:{
              dishId:${dishId}
            }) {
              ok
              error
            }
          }
        `,
          owner2Token,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteDish.ok).toEqual(false);
            expect(res.body.data.deleteDish.error).toEqual(
              'Restaurant not exists.',
            );
          });
      });

      it('should return an error if dish not exists', () => {
        return gqlTest(
          app,
          `
          mutation {
            deleteDish(input:{
              dishId:999
            }) {
              ok
              error
            }
          }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteDish.ok).toEqual(false);
            expect(res.body.data.deleteDish.error).toEqual('Dish not found.');
          });
      });

      it('should delete dish', () => {
        return gqlTest(
          app,
          `
          mutation {
            deleteDish(input:{
              dishId:${dishId}
            }) {
              ok
              error
            }
          }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteDish.ok).toEqual(true);
            expect(res.body.data.deleteDish.error).toEqual(null);
          });
      });
    });
  });
});
