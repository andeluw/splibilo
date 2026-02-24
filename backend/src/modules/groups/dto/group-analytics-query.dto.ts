import { IsOptional, IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class GroupAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  @Expose({ name: 'from' })
  from?: string; // "YYYY-MM-DD"

  @IsOptional()
  @IsString()
  @Expose({ name: 'to' })
  to?: string; // "YYYY-MM-DD"
}
