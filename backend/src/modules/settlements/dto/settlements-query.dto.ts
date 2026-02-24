import { Expose } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class SettlementsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'memberId must be a valid UUID v4.' })
  @Expose({ name: 'member_id' })
  memberId?: string;
}
