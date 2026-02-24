// test/receipt-ocr.service.e2e-spec.ts
import { BadRequestException } from '@nestjs/common';

import sharp from 'sharp';
import Tesseract from 'tesseract.js';
import * as fs from 'fs';
import { ReceiptOcrService } from '../src/modules/receipt-ocr/receipt-ocr.service';

// ---- Mocks ----

// Mock fs.existsSync as a jest.fn
jest.mock('fs', () => ({
  __esModule: true,
  existsSync: jest.fn(),
}));

// Mock sharp (default export) with a chainable API
jest.mock('sharp', () => {
  const sharpFn = jest.fn(() => ({
    rotate: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    grayscale: jest.fn().mockReturnThis(),
    normalize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image')),
  }));

  return {
    __esModule: true,
    default: sharpFn,
  };
});

// Mock Tesseract default export object
jest.mock('tesseract.js', () => ({
  __esModule: true,
  default: {
    recognize: jest.fn(),
  },
}));

describe('ReceiptOcrService (unit-style in E2E project)', () => {
  let service: ReceiptOcrService;

  // Cast imported modules to access the mocked functions
  const existsSyncMock = fs.existsSync as unknown as jest.Mock;
  const mockedSharp = sharp as unknown as jest.Mock;
  const mockedTesseract = Tesseract as unknown as {
    recognize: jest.Mock;
  };

  beforeEach(() => {
    service = new ReceiptOcrService();
    existsSyncMock.mockReset();
    mockedSharp.mockClear();
    mockedTesseract.recognize.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rejects paths containing ".." with BadRequestException', async () => {
    await expect(service.extractRawText('../evil.png')).rejects.toThrow(
      new BadRequestException('Invalid path'),
    );
  });

  it('throws BadRequestException when file does not exist', async () => {
    existsSyncMock.mockReturnValue(false);

    await expect(service.extractRawText('receipts/test.png')).rejects.toThrow(
      new BadRequestException('File not found'),
    );

    expect(existsSyncMock).toHaveBeenCalled();
  });

  it('runs OCR pipeline and returns trimmed text', async () => {
    existsSyncMock.mockReturnValue(true);

    mockedTesseract.recognize.mockResolvedValue({
      data: {
        text: '   Hello OCR \n\n',
      },
    });

    const result = await service.extractRawText('receipts/test.png');

    expect(existsSyncMock).toHaveBeenCalled();
    expect(mockedSharp).toHaveBeenCalledTimes(1);
    expect(mockedTesseract.recognize).toHaveBeenCalledTimes(1);
    expect(result).toBe('Hello OCR');
  });
});
