import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateSettlementDto {
  @IsUUID('4', { message: 'fromUserId must be a valid UUID v4.' })
  @IsNotEmpty({ message: 'fromUserId cannot be empty.' })
  toUserId: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Amount must be a number.' })
  @Min(1, { message: 'Amount must be at least 1.' })
  amount: number;

  @IsOptional()
  @IsString({ message: 'Notes must be a string.' })
  notes?: string;

  @IsOptional()
  @IsString({ message: 'Proof URL must be a string.' })
  proofUrl?: string;

  @IsOptional()
  @IsString({ message: 'Date must be a valid ISO 8601 date string.' })
  date?: string;
}
