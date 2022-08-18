import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { HEADER_TOKEN } from 'src/jwt/jwt.constants';
import { Repository } from 'typeorm';
import { Verification } from 'src/user/entities/verification.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GRAPHQL_ENDPOINT } from './shared/constants-e2e';
import {
  adminE2E,
  categoryE2E,
  customerE2E,
  ownerE2E,
  promotionE2E,
  restaurantE2E,
} from './shared/data-e2e';
import { clearDB, gqlTest } from './shared/utils-e2e';
import { UserService } from 'src/user/user.service';
import { RestaurantService } from 'src/restaurant/restaurant.service';
import { User } from 'src/user/entities/user.entity';
import { CategoryService } from 'src/restaurant/category.service';

jest.mock('mailgun-js', () => {
  return () => ({ messages: () => ({ send: () => {} }) });
});

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;
  let restaurantService: RestaurantService;
  let categoryService: CategoryService;
  let verificationsRepo: Repository<Verification>;
  let usersRepo: Repository<User>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    userService = module.get(UserService);
    restaurantService = module.get(RestaurantService);
    categoryService = module.get(CategoryService);
    verificationsRepo = module.get(getRepositoryToken(Verification));
    usersRepo = module.get(getRepositoryToken(User));
    await app.init();
  });

  afterAll(async () => {
    await clearDB(app);
    await app.close();
  });

  describe('user', () => {
    let token: string;

    describe('createUser', () => {
      it('should create an admin', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              createUser(input:{
                email: "${adminE2E.email}",
                password: "${adminE2E.password}",
                role: ${adminE2E.role},
              }) {
                ok
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.createUser.ok).toEqual(true);
            expect(res.body.data.createUser.error).toEqual(null);
          });
      });

      it('should return an error if admin exists', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              createUser(input:{
                email: "${adminE2E.email}",
                password: "${adminE2E.password}",
                role: ${adminE2E.role},
              }) {
                ok
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.createUser.ok).toEqual(false);
            expect(res.body.data.createUser.error).toEqual(
              'Admin already exists.',
            );
          });
      });

      it('should create a user', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              createUser(input:{
                email: "${customerE2E.email}",
                password: "${customerE2E.password}",
                role: ${customerE2E.role},
              }) {
                ok
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.createUser.ok).toEqual(true);
            expect(res.body.data.createUser.error).toEqual(null);
          });
      });

      it('should return an error if email exists', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              createUser(input:{
                email: "${customerE2E.email}",
                password: "${customerE2E.password}",
                role: ${customerE2E.role},
              }) {
                ok
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.createUser.ok).toEqual(false);
            expect(res.body.data.createUser.error).toEqual(
              'Email already exists.',
            );
          });
      });
    });

    describe('login', () => {
      it('should return an error if email not found', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              login(input:{
                email:"invalid@email.com",
                password:"${customerE2E.password}"
              }) {
                ok
                token
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.login.ok).toEqual(false);
            expect(res.body.data.login.token).toEqual(null);
            expect(res.body.data.login.error).toEqual('User not found.');
          });
      });

      it('should return an error if password is invalid', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              login(input:{
                email:"${customerE2E.email}",
                password:"invalid.password"
              }) {
                ok
                token
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.login.ok).toEqual(false);
            expect(res.body.data.login.token).toEqual(null);
            expect(res.body.data.login.error).toEqual('Invalid password.');
          });
      });

      it('should return a token', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              login(input:{
                email:"${customerE2E.email}",
                password:"${customerE2E.password}"
              }) {
                ok
                token
                error
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.login.ok).toEqual(true);
            expect(res.body.data.login.token).toEqual(expect.any(String));
            expect(res.body.data.login.error).toEqual(null);
            token = res.body.data.login.token;
          });
      });
    });

    describe('seeMe', () => {
      it('should return an error if token is not provided', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            {
              seeMe {
                ok
                error
                result {
                  email
                }
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return a user', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set({ [HEADER_TOKEN]: token })
          .send({
            query: `
            {
              seeMe {
                ok
                error
                result {
                  email
                }
              }
            }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.seeMe.ok).toEqual(true);
            expect(res.body.data.seeMe.error).toEqual(null);
            expect(res.body.data.seeMe.result.email).toEqual(customerE2E.email);
          });
      });
    });

    describe('verifyEmail', () => {
      let verification: Verification;
      beforeAll(async () => {
        [verification] = await verificationsRepo.find();
      });

      it('should return an error if token is not provided', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
          mutation {
            verifyEmail(input:{
              code:"${verification.code}"
            }){
              ok
              error
            }
          }
          `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return an error if code is invalid', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set({ [HEADER_TOKEN]: token })
          .send({
            query: `
        mutation {
          verifyEmail(input:{
            code:"invalid.code"
          }){
            ok
            error
          }
        }
        `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.verifyEmail.ok).toEqual(false);
            expect(res.body.data.verifyEmail.error).toEqual(
              'Invalid verification code',
            );
          });
      });

      it('should verify an email', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set({ [HEADER_TOKEN]: token })
          .send({
            query: `
        mutation {
          verifyEmail(input:{
            code:"${verification.code}"
          }){
            ok
            error
          }
        }
        `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.verifyEmail.ok).toEqual(true);
            expect(res.body.data.verifyEmail.error).toEqual(null);
          });
      });
    });

    describe('editUser', () => {
      it('should return an error if token is not provided', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              editUser(input:{
                email:"new@email.com",
                password:"new.password"
              }){
                ok
                error
              }
            }
            `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should return an error if email exists', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set({ [HEADER_TOKEN]: token })
          .send({
            query: `
            mutation {
              editUser(input:{
                email:"${customerE2E.email}",
              }){
                ok
                error
              }
            }
            `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.editUser.ok).toEqual(false);
            expect(res.body.data.editUser.error).toEqual(
              'Email already exists.',
            );
          });
      });

      it('should edit a user', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set({ [HEADER_TOKEN]: token })
          .send({
            query: `
            mutation {
              editUser(input:{
                email:"new@email.com",
                password:"new.password"
              }){
                ok
                error
              }
            }
            `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.editUser.ok).toEqual(true);
            expect(res.body.data.editUser.error).toEqual(null);
          });
      });
    });

    describe('deleteUser', () => {
      it('should return an error if token is not provided', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .send({
            query: `
            mutation {
              deleteUser{
                ok
                error
              }
            }
            `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.errors[0].message).toEqual('Forbidden resource');
          });
      });

      it('should delete a user', () => {
        return request(app.getHttpServer())
          .post(GRAPHQL_ENDPOINT)
          .set({ [HEADER_TOKEN]: token })
          .send({
            query: `
            mutation {
              deleteUser{
                ok
                error
              }
            }
            `,
          })
          .expect(200)
          .expect(res => {
            expect(res.body.data.deleteUser.ok).toEqual(true);
            expect(res.body.data.deleteUser.error).toEqual(null);
          });
      });
    });
  });

  describe('promotion', () => {
    let ownerToken: string;
    beforeAll(async () => {
      await userService.createUser({
        email: ownerE2E.email,
        password: ownerE2E.password,
        role: ownerE2E.role,
      });
      ({ token: ownerToken } = await userService.login({
        email: ownerE2E.email,
        password: ownerE2E.password,
      }));
    });

    describe('createPromotion', () => {
      it('should return error if role is not owner', () => {
        return gqlTest(
          app,
          `
        mutation {
          createPromotion(input:{
            transactionId:${promotionE2E.transactionId}
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

      it('should return error if restaurant not exists', () => {
        return gqlTest(
          app,
          `
        mutation {
          createPromotion(input:{
            transactionId:${promotionE2E.transactionId}
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
            expect(res.body.data.createPromotion.ok).toEqual(false);
            expect(res.body.data.createPromotion.error).toEqual(
              'Restaurant not exists.',
            );
          });
      });

      it('should create promotion', async () => {
        await categoryService.createCategory({
          name: categoryE2E.name,
          imageUrl: categoryE2E.imageUrl,
        });
        const owner = await usersRepo.findOneBy({ email: ownerE2E.email });
        await restaurantService.createRestaurant(
          {
            name: restaurantE2E.name,
            categorySlug: categoryE2E.slug,
          },
          owner,
        );

        return gqlTest(
          app,
          `
        mutation {
          createPromotion(input:{
            transactionId:${promotionE2E.transactionId}
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
            expect(res.body.data.createPromotion.ok).toEqual(true);
            expect(res.body.data.createPromotion.error).toEqual(null);
          });
      });
    });

    describe('seePromotions', () => {
      it('should return error if role is not owner', () => {
        return gqlTest(
          app,
          `
        {
          seePromotions {
            ok
            error
            result {
              transactionId
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

      it('should return promotions', () => {
        return gqlTest(
          app,
          `
        {
          seePromotions {
            ok
            error
            result {
              transactionId
            }
          }
        }
        `,
          ownerToken,
        )
          .expect(200)
          .expect(res => {
            expect(res.body.data.seePromotions.ok).toEqual(true);
            expect(res.body.data.seePromotions.error).toEqual(null);
            expect(res.body.data.seePromotions.result).toEqual(
              expect.arrayContaining([
                { transactionId: promotionE2E.transactionId },
              ]),
            );
          });
      });
    });
  });
});
