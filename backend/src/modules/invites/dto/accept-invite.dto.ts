import { IsString } from 'class-validator';

export class AcceptInviteDto {
  @IsString({ message: 'Code must be a string' })
  code: string;
}
