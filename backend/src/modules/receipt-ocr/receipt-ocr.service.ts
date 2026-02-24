import { Injectable, BadRequestException } from '@nestjs/common';
import { join } from 'path';
import { existsSync } from 'fs';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

@Injectable()
export class ReceiptOcrService {
  private readonly uploadsRoot = join(process.cwd(), 'uploads');

  async extractRawText(relativePath: string): Promise<string> {
    if (relativePath.includes('..')) {
      throw new BadRequestException('Invalid path');
    }

    const fullPath = join(this.uploadsRoot, relativePath);

    if (!existsSync(fullPath)) {
      throw new BadRequestException('File not found');
    }

    const buffer = await sharp(fullPath)
      .rotate()
      .resize(1500, null, { fit: 'inside' })
      .grayscale()
      .normalize()
      .toBuffer();

    const { data } = await Tesseract.recognize(buffer, 'eng', {
      logger: () => {},
    });

    return (data.text || '').trim();
  }
}
