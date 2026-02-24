import { Expose } from 'class-transformer';
import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { UserRole } from '@prisma/client';

export class UsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: UserRole;

  @IsOptional()
  @IsBooleanString()
  @Expose({ name: 'is_suspended' })
  isSuspended?: string;
}
