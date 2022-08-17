import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import { CategoryService } from 'src/restaurant/category.service';
import { DishService } from 'src/restaurant/dish.service';
import { RestaurantService } from 'src/restaurant/restaurant.service';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import {
  categoryE2E,
  customerE2E,
  dishE2E,
  driverE2E,
  orderE2E,
  ownerE2E,
  restaurantE2E,
} from './shared/data-e2e';
import { createUserAndGetToken, gqlTest } from './shared/utils-e2e';

describe('Order Module (e2e)', () => {
  let app: INestApplication;
  let restaurantService: RestaurantService;
  let dishService: DishService;
  let categoryService: CategoryService;
  let usersRepo: Repository<User>;

  let customerToken: string;
  let ownerToken: string;
  let driverToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    restaurantService = module.get(RestaurantService);
    dishService = module.get(DishService);
    categoryService = module.get(CategoryService);
    usersRepo = module.get(getRepositoryToken(User));
    await app.init();

    customerToken = await createUserAndGetToken(app, customerE2E);
    ownerToken = await createUserAndGetToken(app, ownerE2E);
    driverToken = await createUserAndGetToken(app, driverE2E);

    await categoryService.createCategory({
      name: categoryE2E.name,
      imageUrl: categoryE2E.imageUrl,
    });
    const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
    await restaurantService.createRestaurant(
      { name: restaurantE2E.name, categorySlug: categoryE2E.slug },
      owner,
    );
  });

  afterAll(async () => {
    app.close();
  });

  describe('createOrder', () => {
    let restaurantId: number;
    let dishId: number;
    beforeAll(async () => {
      const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
      ({ dishId } = await dishService.createDish(dishE2E, owner));
      restaurantId = owner.restaurantId;
    });

    it('should return error if role is not customer', () => {
      return gqlTest(
        app,
        `
        mutation {
            createOrder(input:{
              dishes:[
                {
                    dishId:${dishId},
                    count:${orderE2E.dishes[0].count},
                    options:[
                        {
                            name:"${orderE2E.dishes[0].options[0].name}"
                        }
                    ]
                }
              ],
              location:"${orderE2E.location}",
              restaurantId:${restaurantId}
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

    it('should return error if restaurant not found', () => {
      return gqlTest(
        app,
        `
            mutation {
                createOrder(input:{
                  dishes:[
                    {
                        dishId:${dishId},
                        count:${orderE2E.dishes[0].count},
                        options:[
                            {
                                name:"${orderE2E.dishes[0].options[0].name}"
                            }
                        ]
                    }
                  ],
                  location:"${orderE2E.location}",
                  restaurantId:999
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
          expect(res.body.data.createOrder.ok).toEqual(false);
          expect(res.body.data.createOrder.error).toEqual(
            'Restaurant not found.',
          );
        });
    });

    it('should return error if dish not found', () => {
      return gqlTest(
        app,
        `
        mutation {
            createOrder(input:{
                dishes:[
                    {
                        dishId:999,
                        count:${orderE2E.dishes[0].count},
                        options:[
                            {
                                name:"${orderE2E.dishes[0].options[0].name}"
                            }
                        ]
                    }
                  ],
              location:"${orderE2E.location}",
              restaurantId:${restaurantId}
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
          expect(res.body.data.createOrder.ok).toEqual(false);
          expect(res.body.data.createOrder.error).toEqual('Dish not found.');
        });
    });

    it('should return error if dish option not found', () => {
      return gqlTest(
        app,
        `
            mutation {
                createOrder(input:{
                    dishes:[
                        {
                            dishId:${dishId},
                            count:${orderE2E.dishes[0].count},
                            options:[
                                {
                                    name:"invalid dish option"
                                }
                            ]
                        }
                      ],
                  location:"${orderE2E.location}",
                  restaurantId:${restaurantId}
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
          expect(res.body.data.createOrder.ok).toEqual(false);
          expect(res.body.data.createOrder.error).toEqual(
            'Dish option not found.',
          );
        });
    });

    it('should create order', () => {
      return gqlTest(
        app,
        `
            mutation {
                createOrder(input:{
                    dishes:[
                        {
                            dishId:${dishId},
                            count:${orderE2E.dishes[0].count},
                            options:[
                                {
                                    name:"${orderE2E.dishes[0].options[0].name}"
                                }
                            ]
                        }
                      ],
                  location:"${orderE2E.location}",
                  restaurantId:${restaurantId}
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
          expect(res.body.data.createOrder.ok).toEqual(true);
          expect(res.body.data.createOrder.error).toEqual(null);
        });
    });
  });

  describe('seeOrders', () => {
    it('should return error if token is not provided', () => {});

    it('should return orders', () => {});
  });

  describe('seeOrder', () => {
    it('should return error if token is not provided', () => {});

    it('should return error if order not found', () => {});

    it('should return error if not accessible', () => {});

    it('should return order', () => {});
  });

  describe('editOrderStatus', () => {
    it('should return error if role is not driver/owner', () => {});

    it('should return error if order not found', () => {});

    it('should return error if not accessible', () => {});

    it('should return error if not allowed', () => {});

    it('should edit order', () => {});
  });

  describe('pickupOrder', () => {
    it('should return error if role is not driver', () => {});

    it('should return error if order not found', () => {});

    it('should pickup order', () => {});
  });

  describe('orderCreated', () => {
    it('should return error if role is not owner', () => {});
  });

  describe('orderStatusChanged', () => {
    it('should return error if token is not provided', () => {});
  });

  describe('orderCooked', () => {
    it('should return error if role is not driver', () => {});
  });
});
