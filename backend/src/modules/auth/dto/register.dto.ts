import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format.' })
  email: string;

  @IsNotEmpty({ message: 'Name cannot be empty.' })
  @MinLength(3, { message: 'Name must be at least 3 characters long.' })
  name: string;

  @IsNotEmpty({ message: 'Password cannot be empty.' })
  @MinLength(6, { message: 'Password must be at least 6 characters long.' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Avatar URL must be a string.' })
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid user role.' })
  role?: UserRole;
}
