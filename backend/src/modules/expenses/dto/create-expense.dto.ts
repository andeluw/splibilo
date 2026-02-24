import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExpenseShareInputDto {
  @IsString({ message: 'User ID must be a string.' })
  @IsNotEmpty({ message: 'User ID cannot be empty.' })
  userId: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Amount must be a number.' })
  @IsPositive({ message: 'Amount must be a positive number.' })
  amount: number;
}

export class CreateExpenseDto {
  @IsString({ message: 'Description must be a string.' })
  @IsNotEmpty({ message: 'Description cannot be empty.' })
  description: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Amount must be a number.' })
  @IsPositive({ message: 'Amount must be a positive number.' })
  amount: number;

  @IsString({ message: 'Category must be a string.' })
  @IsNotEmpty({ message: 'Category cannot be empty.' })
  category: string;

  @IsDateString({}, { message: 'Date must be a valid ISO 8601 date string.' })
  date: string;

  // user who paid
  @IsString({ message: 'PaidByUserId must be a string.' })
  @IsNotEmpty({ message: 'PaidByUserId cannot be empty.' })
  paidByUserId: string;

  @IsOptional()
  @IsString({ message: 'Receipt URL must be a string.' })
  receiptUrl?: string;

  @IsOptional()
  @IsString({ message: 'Notes must be a string.' })
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseShareInputDto)
  shares: ExpenseShareInputDto[];
}
