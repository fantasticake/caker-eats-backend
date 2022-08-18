import { INestApplication } from '@nestjs/common';
import { HEADER_TOKEN } from 'src/jwt/jwt.constants';
import { CreateUserInput } from 'src/user/dtos/create-user.dto';
import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
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

export const clearDB = async (app: INestApplication) => {
  const dataSource = app.get(DataSource);
  await dataSource.dropDatabase();
};

export const createUserAndGetToken = async (
  app: INestApplication,
  data: CreateUserInput,
): Promise<string> => {
  const userService = app.get(UserService);
  await userService.createUser(data);
  const { token } = await userService.login({
    email: data.email,
    password: data.password,
  });

  return token;
};
