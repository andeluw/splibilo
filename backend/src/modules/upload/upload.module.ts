import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

const ALLOWED_KINDS = ['avatar', 'receipt', 'proof', 'icon'] as const;
type AllowedKind = (typeof ALLOWED_KINDS)[number];

function ensureDir(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function mapKindToFolder(kind: AllowedKind | string): string {
  switch (kind) {
    case 'avatar':
      return 'avatars';
    case 'receipt':
      return 'receipts';
    case 'proof':
      return 'proofs';
    case 'icon':
      return 'icons';
    default:
      return 'others';
  }
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, callback) => {
          const kind = (req.params?.kind as string) ?? 'others';
          const folder = mapKindToFolder(kind);

          const base = './uploads';
          const fullPath = join(base, folder);
          ensureDir(fullPath);

          callback(null, fullPath);
        },
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `file-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        // only image files
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
