import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateExpenseDto, ExpenseShareInputDto } from './create-expense.dto';
import { Type } from 'class-transformer';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseShareInputDto)
  shares?: ExpenseShareInputDto[];
}
