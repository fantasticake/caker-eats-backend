import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { UserService } from 'src/user/user.service';
import { adminE2E, categoryE2E } from './shared/data-e2e';
import { gqlTest } from './shared/utils';

describe('Restaurant Module (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;
  let adminToken: string;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    userService = module.get(UserService);

    await app.init();
  });

  afterAll(async () => {
    app.close();
  });

  describe('createCategory', () => {
    beforeAll(async () => {
      await userService.createUser(adminE2E);
      const result = await userService.login({
        email: adminE2E.email,
        password: adminE2E.password,
      });
      adminToken = result.token;
    });

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
