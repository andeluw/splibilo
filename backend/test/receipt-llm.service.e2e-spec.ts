import { InternalServerErrorException } from '@nestjs/common';
import { geminiClient } from '../src/lib/gemini';
import { ReceiptLlmService } from '../src/modules/receipt-ocr/receipt-llm.service';

describe('ReceiptLlmService (unit-style in E2E project)', () => {
  let service: ReceiptLlmService;
  let generateContentMock: jest.Mock;

  beforeEach(() => {
    generateContentMock = jest.fn();

    (geminiClient as any).getGenerativeModel = jest.fn(() => ({
      generateContent: generateContentMock,
    }));

    service = new ReceiptLlmService();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('throws InternalServerErrorException on empty raw text', async () => {
    await expect(service.parseRawText('   ')).rejects.toThrow(
      new InternalServerErrorException('Empty OCR text'),
    );
  });

  it('parses valid JSON and normalizes items and totals', async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            items: [
              { name: '  Nasi Goreng ', quantity: '2', amount: '35000' },
              { name: 'Tea', quantity: undefined, amount: '10000.00' },
            ],
            subtotal: '45000',
            tax: null,
            grand_total: 45000,
          }),
      },
    });

    const result = await service.parseRawText('some ocr text');

    expect(result.items).toEqual([
      {
        name: 'Nasi Goreng',
        quantity: 2,
        amount: 35000,
      },
      {
        name: 'Tea',
        quantity: 1, // default when falsy
        amount: 10000,
      },
    ]);
    expect(result.subtotal).toBe(45000);
    expect(result.tax).toBeNull();
    expect(result.grand_total).toBe(45000);
  });

  it('handles missing or non-array items by returning empty list', async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            items: null,
            subtotal: null,
            tax: undefined,
            grand_total: undefined,
          }),
      },
    });

    const result = await service.parseRawText('raw text here');

    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items).toHaveLength(0);
    expect(result.subtotal).toBeNull();
    expect(result.tax).toBeNull();
    expect(result.grand_total).toBeNull();
  });

  it('wraps invalid JSON responses in InternalServerErrorException', async () => {
    generateContentMock.mockResolvedValue({
      response: {
        text: () => 'this is not valid json',
      },
    });

    await expect(service.parseRawText('raw text')).rejects.toThrow(
      InternalServerErrorException,
    );
    await expect(service.parseRawText('raw text')).rejects.toThrow(
      'Failed to parse receipt with Gemini',
    );
  });
});
