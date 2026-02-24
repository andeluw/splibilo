import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post('groups/:id/invites')
  @HttpCode(HttpStatus.CREATED)
  async createInvite(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CreateInviteDto,
  ) {
    const invite = await this.invitesService.createInvite(
      id,
      req.user.userId,
      dto,
    );

    return {
      message: 'Invite created successfully',
      data: invite,
    };
  }

  @Post('invites/accept')
  @HttpCode(HttpStatus.OK)
  async acceptInvite(@Request() req, @Body() dto: AcceptInviteDto) {
    const result = await this.invitesService.acceptInvite(req.user.userId, dto);

    return {
      message: result.already_member
        ? 'You are already a member of this group'
        : 'You have successfully joined the group',
      data: result,
    };
  }
}
