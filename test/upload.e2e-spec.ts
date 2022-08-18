import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { HEADER_TOKEN } from 'src/jwt/jwt.constants';
import { UserService } from 'src/user/user.service';
import * as request from 'supertest';
import { customerE2E } from './shared/data-e2e';
import * as AWS from 'aws-sdk';
import { clearDB } from './shared/utils-e2e';

const IMAGE_URL = 'IMAGE_URL';

jest.mock('mailgun-js');
jest.mock('aws-sdk');
(AWS.S3.prototype.upload as jest.Mock).mockReturnValue({
  promise: jest.fn(() => ({
    Location: IMAGE_URL,
  })),
});

describe('Upload Module (e2e)', () => {
  let app: INestApplication;
  let userService: UserService;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    userService = module.get(UserService);

    await app.init();
  });

  afterAll(async () => {
    await clearDB(app);
    await app.close();
  });

  describe('uploadImage', () => {
    let token: string;
    beforeAll(async () => {
      await userService.createUser(customerE2E);
      const result = await userService.login({
        email: customerE2E.email,
        password: customerE2E.password,
      });
      token = result.token;
    });

    it('should return an image url', () => {
      return request(app.getHttpServer())
        .post('/upload')
        .set('Content-Type', 'multipart/form-data')
        .set(HEADER_TOKEN, token)
        .attach('image', `${__dirname}/shared/image-e2e.jpg`)
        .expect(201)
        .expect(res => {
          expect(res.body.ok).toEqual(true);
          expect(res.body.result).toEqual(IMAGE_URL);
          expect(res.body.error).toEqual(undefined);
        });
    });
  });
});
