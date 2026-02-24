import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ExpensesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'Category must be a string.' })
  category?: string;

  @IsOptional()
  @IsString({ message: 'PaidByUserId must be a string.' })
  @Expose({ name: 'paid_by_user_id' })
  paidByUserId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'minAmount must be a number.' })
  @Expose({ name: 'min_amount' })
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'maxAmount must be a number.' })
  @Expose({ name: 'max_amount' })
  maxAmount?: number;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'startDate must be a valid ISO 8601 date string.' },
  )
  @Expose({ name: 'start_date' })
  startDate?: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'endDate must be a valid ISO 8601 date string.' },
  )
  @Expose({ name: 'end_date' })
  endDate?: string;
}
