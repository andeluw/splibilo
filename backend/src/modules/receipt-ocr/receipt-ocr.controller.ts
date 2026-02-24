import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReceiptOcrService } from './receipt-ocr.service';
import { ParseReceiptDto } from './dto/parse-receipt.dto';
import { ReceiptLlmService } from './receipt-llm.service';

@Controller('ocr')
@UseGuards(JwtAuthGuard)
export class ReceiptOcrController {
  constructor(
    private readonly receiptOcrService: ReceiptOcrService,
    private readonly receiptLlmService: ReceiptLlmService,
  ) {}

  @Post('receipt')
  @HttpCode(HttpStatus.OK)
  async parseReceipt(@Body() dto: ParseReceiptDto) {
    const t0 = Date.now();
    const rawText = await this.receiptOcrService.extractRawText(dto.path);
    const t1 = Date.now();
    const parsed = await this.receiptLlmService.parseRawText(rawText);
    const t2 = Date.now();

    // console.log('OCR ms:', t1 - t0);
    // console.log('LLM ms:', t2 - t1);
    // console.log('Total ms:', t2 - t0);

    return {
      message: 'Receipt parsed successfully',
      data: {
        raw_text: rawText,
        items: parsed.items,
        totals: {
          subtotal: parsed.subtotal,
          tax: parsed.tax,
          grand_total: parsed.grand_total,
        },
      },
    };
  }
}
