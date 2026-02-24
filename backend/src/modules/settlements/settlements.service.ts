import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { SettlementsQueryDto } from './dto/settlements-query.dto';
import { GroupBalanceService } from '../groups/group-balance.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SettlementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupBalanceService: GroupBalanceService,
    private readonly mailService: MailService,
  ) {}

  private toResponse(settlement: any) {
    return {
      id: settlement.id,
      groupId: settlement.group_id,
      fromUserId: settlement.from_user_id,
      toUserId: settlement.to_user_id,
      amount: (settlement.amount as Prisma.Decimal).toNumber(),
      notes: settlement.notes,
      proofUrl: settlement.proof_url,
      date: settlement.date,
      fromUser: {
        id: settlement.from_user.id,
        name: settlement.from_user.name,
        email: settlement.from_user.email,
        avatarUrl: settlement.from_user.avatar_url,
      },
      toUser: {
        id: settlement.to_user.id,
        name: settlement.to_user.name,
        email: settlement.to_user.email,
        avatarUrl: settlement.to_user.avatar_url,
      },
    };
  }

  private async ensureGroupMember(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findFirst({
      where: { group_id: groupId, user_id: userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return membership;
  }

  private async ensureGroupExists(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  async createSettlement(
    groupId: string,
    fromUserId: string,
    dto: CreateSettlementDto,
  ) {
    await this.ensureGroupExists(groupId);
    await this.ensureGroupMember(groupId, fromUserId);
    await this.ensureGroupMember(groupId, dto.toUserId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (fromUserId === dto.toUserId) {
      throw new BadRequestException(
        'You cannot create a settlement to yourself',
      );
    }

    // how much does fromUser currently owe to toUser
    const debt = await this.groupBalanceService.getDebtBetween(
      groupId,
      fromUserId,
      dto.toUserId,
    );

    if (debt <= 0) {
      throw new BadRequestException(
        'There is no outstanding debt to this member',
      );
    }

    if (dto.amount > debt + 1e-6) {
      throw new BadRequestException(
        'Settlement amount exceeds the existing debt',
      );
    }

    const [fromUser, toUser] = await this.prisma.$transaction([
      this.prisma.user.findUnique({ where: { id: fromUserId } }),
      this.prisma.user.findUnique({ where: { id: dto.toUserId } }),
    ]);

    if (!fromUser || !toUser) {
      throw new NotFoundException('User not found for settlement');
    }

    const settlement = await this.prisma.settlement.create({
      data: {
        group_id: groupId,
        from_user_id: fromUserId,
        to_user_id: dto.toUserId,
        amount: new Prisma.Decimal(dto.amount),
        notes: dto.notes,
        proof_url: dto.proofUrl,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: {
        from_user: true,
        to_user: true,
      },
    });

    if (toUser.email_on_settlement_received && toUser.email) {
      void this.mailService
        .sendSettlementReceivedMail({
          to: toUser.email,
          receiverName: toUser.name,
          senderName: fromUser.name,
          amount: Number(settlement.amount),
          currency: 'IDR',
          groupName: group.name,
          groupId: group.id,
          settlementId: settlement.id,
          notes: settlement.notes,
        })
        .catch(() => {
          // console.error('Error sending settlement received mail', err);
        });
    }

    return this.toResponse(settlement);
  }

  async listSettlements(
    groupId: string,
    currentUserId: string,
    query: SettlementsQueryDto,
  ) {
    await this.ensureGroupExists(groupId);
    await this.ensureGroupMember(groupId, currentUserId);

    const where: Prisma.SettlementWhereInput = {
      group_id: groupId,
    };

    if (query.memberId) {
      where.OR = [
        { from_user_id: query.memberId },
        { to_user_id: query.memberId },
      ];
    }

    if (query.disablePagination) {
      const items = await this.prisma.settlement.findMany({
        where,
        orderBy: { date: query.sortDir ?? 'desc' },
        include: {
          from_user: true,
          to_user: true,
        },
      });

      return {
        data: items.map((s) => this.toResponse(s)),
      };
    }

    const [items, count] = await this.prisma.$transaction([
      this.prisma.settlement.findMany({
        where,
        orderBy: { date: query.sortDir ?? 'desc' },
        skip: query.offset,
        take: query.limit,
        include: {
          from_user: true,
          to_user: true,
        },
      }),
      this.prisma.settlement.count({ where }),
    ]);

    return {
      data: items.map((s) => this.toResponse(s)),
      meta: query.toMeta(count),
    };
  }

  async getSettlementDetail(
    groupId: string,
    currentUserId: string,
    settlementId: string,
  ) {
    await this.ensureGroupExists(groupId);
    await this.ensureGroupMember(groupId, currentUserId);

    const settlement = await this.prisma.settlement.findFirst({
      where: {
        id: settlementId,
        group_id: groupId,
      },
      include: {
        from_user: true,
        to_user: true,
      },
    });

    if (!settlement) {
      throw new NotFoundException('Settlement not found in this group');
    }

    return this.toResponse(settlement);
  }
}
