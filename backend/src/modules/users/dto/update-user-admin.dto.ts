import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  IsIn,
} from 'class-validator';
import { UserRole } from '@prisma/client';

// DTO for admin to update other users
export class UpdateUserAdminDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsIn(['USER', 'ADMIN'])
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isSuspended?: boolean;
}
