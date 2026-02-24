import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';

const ALLOWED_KINDS = ['avatar', 'receipt', 'proof', 'icon'] as const;
type AllowedKind = (typeof ALLOWED_KINDS)[number];

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(':kind')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  async uploadFile(
    @Param('kind') kind: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!ALLOWED_KINDS.includes(kind as AllowedKind)) {
      throw new BadRequestException('Invalid upload kind');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const typedKind = kind as AllowedKind;

    const info = this.uploadService.buildFileInfo(
      req,
      typedKind,
      file.filename,
    );

    return {
      message: 'File uploaded successfully',
      data: info,
    };
  }
}
