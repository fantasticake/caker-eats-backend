import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import * as request from 'supertest';
import { GRAPHQL_ENDPOINT } from './constants-e2e';

describe('Restaurant Module (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    app.close();
  });

  describe('createCategory', () => {
    it('should create a category', () => {
      return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({});
    });
  });

  describe('deleteCategory', () => {});

  describe('seeCategories', () => {});

  describe('seeCategory', () => {});
});
