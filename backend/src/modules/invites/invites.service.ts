import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GroupRole } from '@prisma/client';
import { CreateInviteDto } from './dto/create-invite.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { MailService } from '../mail/mail.service';
import { customAlphabet } from 'nanoid';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_LENGTH = 8;

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private generateCode() {
    return customAlphabet(INVITE_ALPHABET, INVITE_LENGTH)();
  }

  private async ensureGroupOwner(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        group_id: groupId,
        user_id: userId,
        role: GroupRole.OWNER,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only group owner can send invites');
    }

    return membership;
  }

  async createInvite(
    groupId: string,
    actingUserId: string,
    dto: CreateInviteDto,
  ) {
    await this.ensureGroupOwner(groupId, actingUserId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        is_archived: true,
        is_suspended: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.is_archived || group.is_suspended) {
      throw new BadRequestException('Group is not joinable');
    }

    // If user with this email already in group, no need to invite
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existingUser) {
      const existingMember = await this.prisma.groupMember.findFirst({
        where: {
          group_id: groupId,
          user_id: existingUser.id,
        },
      });

      if (existingMember) {
        throw new BadRequestException(
          'User with this email is already a member of the group',
        );
      }
    }

    // Check existing invite for same group + email
    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        group_id: groupId,
        email: dto.email,
        accepted_at: null,
      },
    });

    if (existingInvite) {
      throw new BadRequestException(
        'An active invite already exists for this email in this group',
      );
    }

    const code = this.generateCode();

    const invite = await this.prisma.invite.create({
      data: {
        email: dto.email,
        group_id: groupId,
        code,
        expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    // Fire and forget email, errors can be caught/logged separately if you want
    await this.mailService.sendGroupInviteMail({
      to: dto.email,
      groupName: group.name,
      inviteCode: invite.code,
      inviteId: invite.id,
    });

    return invite;
  }

  async acceptInvite(userId: string, dto: AcceptInviteDto) {
    const invite = await this.prisma.invite.findUnique({
      where: { code: dto.code },
      include: {
        group: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.accepted_at) {
      throw new BadRequestException('Invite has already been accepted');
    }

    if (invite.expired_at && invite.expired_at < new Date()) {
      throw new BadRequestException('Invite has expired');
    }

    if (invite.group.is_archived || invite.group.is_suspended) {
      throw new BadRequestException('Group is not joinable');
    }

    // Check if this user is already a member
    const existingMember = await this.prisma.groupMember.findFirst({
      where: {
        group_id: invite.group_id,
        user_id: userId,
      },
    });

    if (existingMember) {
      // Mark invite as accepted so it does not hang forever
      if (!invite.accepted_at) {
        await this.prisma.invite.update({
          where: { id: invite.id },
          data: { accepted_at: new Date() },
        });
      }

      return {
        group_id: invite.group_id,
        already_member: true,
      };
    }

    await this.prisma.$transaction([
      this.prisma.groupMember.create({
        data: {
          group_id: invite.group_id,
          user_id: userId,
          role: GroupRole.MEMBER,
        },
      }),
      this.prisma.invite.update({
        where: { id: invite.id },
        data: { accepted_at: new Date() },
      }),
    ]);

    return {
      group_id: invite.group_id,
      already_member: false,
    };
  }
}
