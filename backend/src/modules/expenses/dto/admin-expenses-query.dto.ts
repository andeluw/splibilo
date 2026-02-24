import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class AdminExpensesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Expose({ name: 'group_id' })
  groupId?: string;

  @IsOptional()
  @IsString()
  @Expose({ name: 'paid_by_user_id' })
  paidByUserId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Expose({ name: 'min_amount' })
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Expose({ name: 'max_amount' })
  maxAmount?: number;

  @IsOptional()
  @IsDateString()
  @Expose({ name: 'start_date' })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Expose({ name: 'end_date' })
  endDate?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @Expose({ name: 'has_receipt' })
  hasReceipt?: boolean;
}
