import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { customerTestData } from 'src/test/test.data';
import { UploadService } from './upload.service';
import * as AWS from 'aws-sdk';

//@ts-ignore
import testImage from '../test/test.image.jpg';

const ENVIRONMENT_VAR = 'ENVIRONMENT_VAR';
const TEST_IMAGE_URL = 'TEST_IMAGE_URL';

jest.mock('aws-sdk');

const getMockedConfigService = () => {
  return {
    get: jest.fn(() => ENVIRONMENT_VAR),
  };
};

describe('UploadService', () => {
  let uploadService: UploadService;
  let configService: Record<keyof ConfigService, jest.Mock>;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: ConfigService, useValue: getMockedConfigService() },
      ],
    }).compile();
    uploadService = module.get(UploadService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(uploadService).toBeDefined();
  });

  describe('uploadImage', () => {
    it('should return image url', async () => {
      const mockedUploadPromise = jest.fn(() => ({ Location: TEST_IMAGE_URL }));
      (AWS.S3.prototype.upload as jest.Mock).mockReturnValueOnce({
        promise: mockedUploadPromise,
      });
      const result = await uploadService.uploadImage(
        testImage,
        customerTestData,
      );
      expect(AWS.S3).toBeCalledTimes(1);
      expect(AWS.S3).toBeCalledWith({
        accessKeyId: ENVIRONMENT_VAR,
        secretAccessKey: ENVIRONMENT_VAR,
        region: 'ap-northeast-2',
      });
      expect(AWS.S3.prototype.upload).toBeCalledTimes(1);
      expect(AWS.S3.prototype.upload).toBeCalledWith({
        ACL: 'public-read',
        Bucket: 'caker-eats-uploads',
        Body: testImage.buffer,
        Key: expect.any(String),
      });
      expect(mockedUploadPromise).toBeCalledTimes(1);
      expect(result).toEqual({ ok: true, result: TEST_IMAGE_URL });
    });

    it('should return error if it fails', async () => {
      (AWS.S3.prototype.upload as jest.Mock).mockReturnValueOnce(new Error());
      const result = await uploadService.uploadImage(
        testImage,
        customerTestData,
      );
      expect(result).toEqual({ ok: false, error: 'Cannot upload an image.' });
    });
  });
});
