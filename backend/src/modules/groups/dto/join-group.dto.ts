import { IsNotEmpty, IsString } from 'class-validator';

export class JoinGroupDto {
  @IsString({ message: 'Invite code must be a string.' })
  @IsNotEmpty({ message: 'Invite code cannot be empty.' })
  inviteCode: string;
}
