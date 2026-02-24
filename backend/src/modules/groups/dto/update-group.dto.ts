import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateGroupDto {
  @IsOptional()
  @IsString({ message: 'Group name must be a string.' })
  @MaxLength(100, { message: 'Group name cannot exceed 100 characters.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string.' })
  @MaxLength(255, { message: 'Description cannot exceed 255 characters.' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Category must be a string.' })
  @MaxLength(50, { message: 'Category cannot exceed 50 characters.' })
  category?: string;

  @IsOptional()
  @IsString({ message: 'Icon URL must be a string.' })
  iconUrl?: string;

  @IsOptional()
  @IsBoolean({ message: 'isLocked must be true or false.' })
  isLocked?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({
    message: 'membersCanEditAllExpenses must be true or false.',
  })
  membersCanEditAllExpenses?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'membersCanDeleteExpenses must be true or false.' })
  membersCanDeleteExpenses?: boolean;
}
