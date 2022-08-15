import { INestApplication } from '@nestjs/common';
import { HEADER_TOKEN } from 'src/jwt/jwt.constants';
import * as request from 'supertest';
import { GRAPHQL_ENDPOINT } from './constants-e2e';

export const gqlTest = (
  app: INestApplication,
  query: string,
  token?: string,
) => {
  if (token)
    return request(app.getHttpServer())
      .post(GRAPHQL_ENDPOINT)
      .set(HEADER_TOKEN, token)
      .send({
        query,
      });
  return request(app.getHttpServer()).post(GRAPHQL_ENDPOINT).send({
    query,
  });
};
