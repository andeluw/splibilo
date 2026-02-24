import { IsNotEmpty, IsString } from 'class-validator';

export class ParseReceiptDto {
  @IsString()
  @IsNotEmpty()
  path: string; // ex. "receipts/file-1765023313866-883657453.jpg"
}
