import {
  Controller,
  FileTypeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LoggedInUser } from 'src/auth/decorators/logged-in-user.decorator';
import { Role } from 'src/auth/decorators/role.decorator';
import { User } from 'src/user/entities/user.entity';
import { UploadImageOutput } from './dtos/upload-image.dto';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Role(['Any'])
  @Post('/')
  @UseInterceptors(FileInterceptor('image'))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
      }),
    )
    image: Express.Multer.File,
    @LoggedInUser() loggedInUser: User,
  ): Promise<UploadImageOutput> {
    return this.uploadService.uploadImage(image, loggedInUser);
  }
}
