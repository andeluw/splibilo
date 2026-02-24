import { IsNotEmpty } from 'class-validator';

export class LogoutDto {
  @IsNotEmpty({ message: 'Refresh token cannot be empty.' })
  refreshToken: string;
}
