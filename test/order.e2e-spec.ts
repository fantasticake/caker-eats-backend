import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'src/app.module';
import { OrderStatus } from 'src/order/entities/order.entity';
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
import { clearDB, createUserAndGetToken, gqlTest } from './shared/utils-e2e';

describe('Order Module (e2e)', () => {
  let app: INestApplication;
  let restaurantService: RestaurantService;
  let dishService: DishService;
  let categoryService: CategoryService;
  let usersRepo: Repository<User>;

  let customerToken: string;
  let ownerToken: string;
  let driverToken: string;

  let orderId: number;

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
    await clearDB(app);
    await app.close();
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
    it('should return error if token is not provided', () => {
      return gqlTest(
        app,
        `
      {
        seeOrders {
          ok
          error
          result {
            id
          }
        }
      }
      `,
      )
        .expect(200)
        .expect(res => {
          expect(res.body.errors[0].message).toEqual('Forbidden resource');
        });
    });

    it('should return orders', () => {
      return gqlTest(
        app,
        `
      {
        seeOrders {
          ok
          error
          result {
            id
          }
        }
      }
      `,
        customerToken,
      )
        .expect(200)
        .expect(
          ({
            body: {
              data: {
                seeOrders: { ok, error, result },
              },
            },
          }) => {
            expect(ok).toEqual(true);
            expect(error).toEqual(null);
            expect(result).toEqual(
              expect.arrayContaining([{ id: expect.any(Number) }]),
            );
            orderId = result[0].id;
          },
        );
    });
  });

  describe('seeOrder', () => {
    it('should return error if token is not provided', () => {
      return gqlTest(
        app,
        `
      {
        seeOrder(input:{
          orderId:${orderId}
        }) {
          ok
          error
          result {
            id
          }
        }
      }
      `,
      )
        .expect(200)
        .expect(res => {
          expect(res.body.errors[0].message).toEqual('Forbidden resource');
        });
    });

    it('should return error if order not found', () => {
      return gqlTest(
        app,
        `
      {
        seeOrder(input:{
          orderId:999
        }) {
          ok
          error
          result {
            id
          }
        }
      }
      `,
        customerToken,
      )
        .expect(200)
        .expect(
          ({
            body: {
              data: {
                seeOrder: { ok, error, result },
              },
            },
          }) => {
            expect(ok).toEqual(false);
            expect(error).toEqual('Order not found.');
            expect(result).toEqual(null);
          },
        );
    });

    it('should return error if not accessible', () => {
      return gqlTest(
        app,
        `
      {
        seeOrder(input:{
          orderId:${orderId}
        }) {
          ok
          error
          result {
            id
          }
        }
      }
      `,
        driverToken,
      )
        .expect(200)
        .expect(
          ({
            body: {
              data: {
                seeOrder: { ok, error, result },
              },
            },
          }) => {
            expect(ok).toEqual(false);
            expect(error).toEqual('Cannot access an order.');
            expect(result).toEqual(null);
          },
        );
    });

    it('should return order', () => {
      return gqlTest(
        app,
        `
      {
        seeOrder(input:{
          orderId:${orderId}
        }) {
          ok
          error
          result {
            id
          }
        }
      }
      `,
        customerToken,
      )
        .expect(200)
        .expect(
          ({
            body: {
              data: {
                seeOrder: { ok, error, result },
              },
            },
          }) => {
            expect(ok).toEqual(true);
            expect(error).toEqual(null);
            expect(result).toEqual({ id: orderId });
          },
        );
    });
  });

  describe('editOrderStatus', () => {
    it('should return error if role is not driver/owner', () => {
      return gqlTest(
        app,
        `
        mutation {
          editOrderStatus(input:{
            orderId:${orderId}
            status:${OrderStatus.Cooking}
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

    it('should return error if order not found', () => {
      return gqlTest(
        app,
        `
        mutation {
          editOrderStatus(input:{
            orderId:999
            status:${OrderStatus.Cooking}
          }) {
            ok
            error
          }
        }
      `,
        ownerToken,
      )
        .expect(200)
        .expect(
          ({
            body: {
              data: {
                editOrderStatus: { ok, error },
              },
            },
          }) => {
            expect(ok).toEqual(false);
            expect(error).toEqual('Order not found.');
          },
        );
    });

    it('should return error if not accessible', () => {
      return gqlTest(
        app,
        `
        mutation {
          editOrderStatus(input:{
            orderId:${orderId}
            status:${OrderStatus.Cooking}
          }) {
            ok
            error
          }
        }
      `,
        driverToken,
      )
        .expect(200)
        .expect(
          ({
            body: {
              data: {
                editOrderStatus: { ok, error },
              },
            },
          }) => {
            expect(ok).toEqual(false);
            expect(error).toEqual('Cannot access an order.');
          },
        );
    });

    it('should return error if not allowed', () => {
      return gqlTest(
        app,
        `
        mutation {
          editOrderStatus(input:{
            orderId:${orderId}
            status:${OrderStatus.PickedUp}
          }) {
            ok
            error
          }
        }
      `,
        ownerToken,
      )
        .expect(200)
        .expect(
          ({
            body: {
              data: {
                editOrderStatus: { ok, error },
              },
            },
          }) => {
            expect(ok).toEqual(false);
            expect(error).toEqual('Not allowed to edit order status.');
          },
        );
    });

    it('should edit order', () => {
      return gqlTest(
        app,
        `
        mutation {
          editOrderStatus(input:{
            orderId:${orderId}
            status:${OrderStatus.Cooking}
          }) {
            ok
            error
          }
        }
      `,
        ownerToken,
      )
        .expect(200)
        .expect(
          ({
            body: {
              data: {
                editOrderStatus: { ok, error },
              },
            },
          }) => {
            expect(ok).toEqual(true);
            expect(error).toEqual(null);
          },
        );
    });
  });

  describe('pickupOrder', () => {
    it('should return error if role is not driver', () => {
      return gqlTest(
        app,
        `
        mutation {
          pickupOrder(input:{
            orderId:${orderId}
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

    it('should return error if order not found', () => {
      return gqlTest(
        app,
        `
        mutation {
          pickupOrder(input:{
            orderId:999
          }) {
            ok
            error
          }
        }
      `,
        driverToken,
      )
        .expect(200)
        .expect(
          ({
            body: {
              data: {
                pickupOrder: { ok, error },
              },
            },
          }) => {
            expect(ok).toEqual(false);
            expect(error).toEqual('Order not found.');
          },
        );
    });

    it('should pickup order', () => {
      return gqlTest(
        app,
        `
        mutation {
          pickupOrder(input:{
            orderId:${orderId}
          }) {
            ok
            error
          }
        }
      `,
        driverToken,
      )
        .expect(200)
        .expect(
          ({
            body: {
              data: {
                pickupOrder: { ok, error },
              },
            },
          }) => {
            expect(ok).toEqual(true);
            expect(error).toEqual(null);
          },
        );
    });
  });
});
