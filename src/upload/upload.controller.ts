import {
  Controller,
  FileTypeValidator,
  Header,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadImageOutput } from './dtos/upload-image.dto';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('/')
  @UseInterceptors(FileInterceptor('image'))
  @Header('Access-Control-Allow-Origin', '*')
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileTypeValidator({ fileType: 'image/*' })],
      }),
    )
    image: Express.Multer.File,
  ): Promise<UploadImageOutput> {
    return await this.uploadService.uploadImage(image);
  }
}
