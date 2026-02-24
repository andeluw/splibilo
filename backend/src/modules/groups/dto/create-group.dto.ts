import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGroupDto {
  @IsString({ message: 'Group name must be a string.' })
  @IsNotEmpty({ message: 'Group name cannot be empty.' })
  @MaxLength(100, { message: 'Group name cannot exceed 100 characters.' })
  name: string;

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
  @Type(() => Boolean)
  membersCanEditAllExpenses?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  membersCanDeleteExpenses?: boolean;
}
