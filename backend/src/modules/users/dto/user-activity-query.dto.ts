import { IsOptional, IsString } from 'class-validator';

export class UserActivityQueryDto {
  @IsOptional()
  @IsString()
  from?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  to?: string; // YYYY-MM-DD
}
