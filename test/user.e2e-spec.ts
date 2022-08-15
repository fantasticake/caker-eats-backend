import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { HEADER_TOKEN } from 'src/jwt/jwt.constants';
import { Repository } from 'typeorm';
import { Verification } from 'src/user/entities/verification.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GRAPHQL_ENDPOINT } from './shared/constants-e2e';
import { adminE2E, customerE2E } from './shared/data-e2e';

jest.mock('mailgun-js', () => {
  return () => ({ messages: () => ({ send: () => {} }) });
});

let token: string;

describe('User Module (e2e)', () => {
  let app: INestApplication;
  let verificationsRepository: Repository<Verification>;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    verificationsRepository = app.get(getRepositoryToken(Verification));
    await app.init();
  });

  afterAll(async () => {
    app.close();
  });

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
      [verification] = await verificationsRepository.find();
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
              email:"test@email.com",
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
          expect(res.body.data.editUser.error).toEqual('Email already exists.');
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
