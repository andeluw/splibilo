import { Module } from '@nestjs/common';
import { ReceiptOcrService } from './receipt-ocr.service';
import { ReceiptOcrController } from './receipt-ocr.controller';
import { ReceiptLlmService } from './receipt-llm.service';

@Module({
  providers: [ReceiptOcrService, ReceiptLlmService],
  controllers: [ReceiptOcrController],
})
export class ReceiptOcrModule {}
