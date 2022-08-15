import { UploadImageOutput } from './dtos/upload-image.dto';
import * as AWS from 'aws-sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  async uploadImage(
    image: Express.Multer.File,
    loggedInUser: User,
  ): Promise<UploadImageOutput> {
    try {
      const s3 = new AWS.S3({
        accessKeyId: this.configService.get('AWS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_KEY'),
        region: 'ap-northeast-2',
      });
      const { Location: url } = await s3
        .upload({
          ACL: 'public-read',
          Bucket: 'caker-eats-uploads',
          Body: image.buffer,
          Key: `${loggedInUser.id}-${Date.now()}-${image.originalname}`,
        })
        .promise();

      return { ok: true, result: url };
    } catch (error) {
      console.log(error);
      return { ok: false, error: 'Cannot upload an image.' };
    }
  }
}
