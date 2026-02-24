import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { JoinGroupDto } from './dto/join-group.dto';
import { GroupRole, Prisma, UserRole } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import { GroupsQueryDto } from './dto/groups-query.dto';
import { GroupBalanceService } from './group-balance.service';
import { GroupAnalyticsQueryDto } from './dto/group-analytics-query.dto';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const INVITE_LENGTH = 8;

@Injectable()
export class GroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupBalanceService: GroupBalanceService,
  ) {}

  private async generateUniqueInviteCode(): Promise<string> {
    while (true) {
      const code = customAlphabet(INVITE_ALPHABET, INVITE_LENGTH)();

      const existing = await this.prisma.group.findUnique({
        where: { invite_code: code },
      });

      if (!existing) return code;
    }
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

  private async ensureGroupOwner(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        group_id: groupId,
        user_id: userId,
        role: GroupRole.OWNER,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only group owner can perform this action');
    }

    return membership;
  }

  async createGroup(userId: string, dto: CreateGroupDto) {
    const inviteCode = await this.generateUniqueInviteCode();

    const group = await this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        ...(dto.iconUrl ? { icon_url: dto.iconUrl } : {}),
        invite_code: inviteCode,
        group_members: {
          create: {
            user_id: userId,
            role: GroupRole.OWNER,
          },
        },
      },
      include: {
        group_members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    return group;
  }

  async listMyGroups(userId: string, query: GroupsQueryDto) {
    const where: Prisma.GroupWhereInput = {
      group_members: {
        some: { user_id: userId },
      },
      ...(query.search
        ? {
            name: {
              contains: query.search,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.category
        ? {
            category: {
              contains: query.category,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(typeof query.isArchived !== 'undefined'
        ? {
            is_archived: Boolean(query.isArchived === 'true'),
          }
        : {}),
    };

    const attachSummaries = async (groups) => {
      const withSummary = await Promise.all(
        groups.map(async (group) => {
          const netByUser = await this.groupBalanceService.getNetByUser(
            group.id,
          );

          const netForMe = netByUser[userId] ?? new Prisma.Decimal(0);

          return {
            ...group,
            members_count: group._count?.group_members ?? 0,
            user_net_balance: netForMe.toNumber(),
          };
        }),
      );

      return withSummary;
    };

    if (query.disablePagination) {
      const groups = await this.prisma.group.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: {
              group_members: true,
            },
          },
        },
      });

      const data = await attachSummaries(groups);

      return {
        data,
      };
    }

    const [groups, count] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: query.offset,
        take: query.limit,
        include: {
          _count: {
            select: {
              group_members: true,
            },
          },
        },
      }),
      this.prisma.group.count({ where }),
    ]);

    const data = await attachSummaries(groups);

    return {
      data,
      meta: query.toMeta(count),
    };
  }

  async getGroupDetail(groupId: string, userId: string) {
    await this.ensureGroupMember(groupId, userId);

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        group_members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const edges = await this.groupBalanceService.getEdges(groupId);

    const shouldPay = edges.filter((e) => e.fromUserId === userId);
    const shouldReceive = edges.filter((e) => e.toUserId === userId);

    const totalShouldPay = shouldPay.reduce((sum, e) => sum + e.amount, 0);
    const totalShouldReceive = shouldReceive.reduce(
      (sum, e) => sum + e.amount,
      0,
    );

    const net = totalShouldReceive - totalShouldPay;

    return {
      ...group,
      me_balance: {
        net,
        total_should_pay: totalShouldPay,
        total_should_receive: totalShouldReceive,
      },
    };
  }

  async updateGroup(groupId: string, userId: string, dto: UpdateGroupDto) {
    const membership = await this.ensureGroupMember(groupId, userId);
    const isOwner = membership.role === GroupRole.OWNER;
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!isOwner) {
      if (
        typeof dto.isLocked !== 'undefined' ||
        typeof dto.membersCanEditAllExpenses !== 'undefined' ||
        typeof dto.membersCanDeleteExpenses !== 'undefined'
      ) {
        throw new ForbiddenException(
          'Only group owners can change group settings such as lock and member permissions',
        );
      }
    }

    const data: Prisma.GroupUpdateInput = {};

    // Everyone (owner + member) can update these
    if (typeof dto.name !== 'undefined') {
      data.name = dto.name;
    }
    if (typeof dto.description !== 'undefined') {
      data.description = dto.description;
    }
    if (typeof dto.category !== 'undefined') {
      data.category = dto.category;
    }
    data.icon_url = dto.iconUrl
      ? dto.iconUrl
      : group?.icon_url != null && dto.iconUrl == null
        ? null
        : group?.icon_url;

    // Only owner can update these
    if (isOwner) {
      if (typeof dto.isLocked !== 'undefined') {
        data.is_locked = dto.isLocked;
      }
      if (typeof dto.membersCanEditAllExpenses !== 'undefined') {
        data.members_can_edit_all_expenses = dto.membersCanEditAllExpenses;
      }
      if (typeof dto.membersCanDeleteExpenses !== 'undefined') {
        data.members_can_delete_expenses = dto.membersCanDeleteExpenses;
      }
    }

    if (Object.keys(data).length === 0) {
      return this.prisma.group.findUnique({ where: { id: groupId } });
    }

    const groupUpdated = await this.prisma.group.update({
      where: { id: groupId },
      data,
    });

    return groupUpdated;
  }

  async archiveGroup(groupId: string, userId: string) {
    await this.ensureGroupOwner(groupId, userId);

    const group = await this.prisma.group.update({
      where: { id: groupId },
      data: {
        is_archived: true,
        is_locked: true,
      },
    });

    return group;
  }

  async unarchiveGroup(groupId: string, userId: string) {
    await this.ensureGroupOwner(groupId, userId);

    const group = await this.prisma.group.update({
      where: { id: groupId },
      data: {
        is_archived: false,
        is_locked: false,
      },
    });

    return group;
  }

  async listMembers(groupId: string, userId: string, userRole: UserRole) {
    if (userRole !== UserRole.ADMIN) {
      await this.ensureGroupMember(groupId, userId);
    }

    const members = await this.prisma.groupMember.findMany({
      where: { group_id: groupId },
      orderBy: { joined_at: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });

    return members;
  }

  async joinByInviteCode(userId: string, dto: JoinGroupDto) {
    const group = await this.prisma.group.findFirst({
      where: {
        invite_code: dto.inviteCode,
        is_archived: false,
        is_suspended: false,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found or not joinable');
    }

    const existingMember = await this.prisma.groupMember.findFirst({
      where: {
        group_id: group.id,
        user_id: userId,
      },
    });

    if (existingMember) {
      throw new ConflictException('You are already a member of this group');
    }

    await this.prisma.groupMember.create({
      data: {
        group_id: group.id,
        user_id: userId,
        role: GroupRole.MEMBER,
      },
    });

    return group;
  }

  async removeMember(groupId: string, memberId: string, actingUserId: string) {
    // Only owner can remove members
    await this.ensureGroupOwner(groupId, actingUserId);

    const membership = await this.prisma.groupMember.findUnique({
      where: { id: memberId },
    });

    if (!membership || membership.group_id !== groupId) {
      throw new NotFoundException('Member not found in this group');
    }

    // Cannot remove the last owner
    if (membership.role === GroupRole.OWNER) {
      const ownerCount = await this.prisma.groupMember.count({
        where: {
          group_id: groupId,
          role: GroupRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Owner cannot be removed as the only owner',
        );
      }
    }

    // Check net balance before removing
    const netByUser = await this.groupBalanceService.getNetByUser(groupId);
    const netForMember = netByUser[membership.user_id];

    // If they appear in the net map and their balance is not zero, block removal.
    if (netForMember && !netForMember.eq(0)) {
      if (netForMember.gt(0)) {
        // Positive => others owe this user
        throw new BadRequestException(
          'Member cannot be removed because other members still owe them money in this group',
        );
      } else {
        // Negative => this user owes others
        throw new BadRequestException(
          'Member cannot be removed because they still owe money in this group',
        );
      }
    }

    await this.prisma.groupMember.delete({
      where: { id: memberId },
    });

    return { success: true };
  }
  async leaveGroup(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        group_id: groupId,
        user_id: userId,
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this group');
    }

    if (membership.role === GroupRole.OWNER) {
      const ownerCount = await this.prisma.groupMember.count({
        where: {
          group_id: groupId,
          role: GroupRole.OWNER,
        },
      });

      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Owner cannot leave the group as the only owner',
        );
      }
    }

    await this.prisma.groupMember.delete({
      where: { id: membership.id },
    });

    return { success: true };
  }

  async listAllGroupsAsAdmin(query: GroupsQueryDto) {
    const where: Prisma.GroupWhereInput = {
      ...(query.search
        ? {
            name: {
              contains: query.search,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.category
        ? {
            category: query.category,
          }
        : {}),
      ...(typeof query.isArchived !== 'undefined'
        ? {
            is_archived: Boolean(query.isArchived === 'true'),
          }
        : {}),
    };

    if (query.disablePagination) {
      const groups = await this.prisma.group.findMany({
        where,
        orderBy: { created_at: 'desc' },
      });

      return {
        data: groups,
      };
    }

    const [groups, count] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: query.offset,
        take: query.limit,
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      data: groups,
      meta: query.toMeta(count),
    };
  }

  async getGroupDetailAsAdmin(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        group_members: {
          orderBy: { joined_at: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar_url: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  // BALANCE RELATED METHODS
  async getGroupBalances(groupId: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Ensure caller is in the group
    await this.ensureGroupMember(groupId, userId);

    const edges = await this.groupBalanceService.getEdges(groupId);

    const shouldPay = edges.filter((e) => e.fromUserId === userId);
    const shouldReceive = edges.filter((e) => e.toUserId === userId);

    return {
      debts: edges,
      me: {
        shouldPay,
        shouldReceive,
      },
    };
  }

  // Analytics
  private parseAnalyticsRange(query: GroupAnalyticsQueryDto) {
    let applied = false;
    let from: Date;
    let to: Date;

    if (query.from && query.to) {
      // Assume "YYYY-MM-DD"
      from = new Date(`${query.from}T00:00:00.000Z`);
      to = new Date(`${query.to}T23:59:59.999Z`);
      applied = true;
    } else {
      // Default: last 30 days
      to = new Date();
      from = new Date(to);
      from.setDate(to.getDate() - 29);
      applied = false;
    }

    if (from > to) {
      throw new BadRequestException('Invalid date range');
    }

    return { from, to, applied };
  }

  async getGroupAnalytics(
    groupId: string,
    userId: string,
    query: GroupAnalyticsQueryDto,
  ) {
    // ensure membership
    await this.ensureGroupMember(groupId, userId);

    const { from, to, applied } = this.parseAnalyticsRange(query);

    // Fetch all expenses & settlements in range
    const [expenses, settlements] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where: {
          group_id: groupId,
          date: {
            gte: from,
            lte: to,
          },
        },
        select: {
          amount: true,
          category: true,
          date: true,
          created_by_id: true,
          paid_by_id: true,
        },
      }),
      this.prisma.settlement.findMany({
        where: {
          group_id: groupId,
          date: {
            gte: from,
            lte: to,
          },
        },
        select: {
          amount: true,
          date: true,
          from_user_id: true,
          to_user_id: true,
        },
      }),
    ]);

    // Totals
    let groupTotalExpenses = 0;
    let groupTotalSettlements = 0;
    let meTotalExpensesCreated = 0;
    let meTotalPaidAsPayer = 0;
    let meTotalSettlementsMade = 0;

    // For by_category
    const byCategoryMap: Record<
      string,
      { category: string; totalAmount: number; count: number }
    > = {};

    // For by_date
    const byDateMap: Record<
      string,
      {
        date: string;
        totalExpenses: number;
        expensesCount: number;
        totalSettlements: number;
        settlementsCount: number;
      }
    > = {};

    // For top_payers
    const payerTotals: Record<string, number> = {};

    // Process expenses
    for (const exp of expenses) {
      const amount = Number(exp.amount);
      groupTotalExpenses += amount;

      if (exp.created_by_id === userId) {
        meTotalExpensesCreated += amount;
      }
      if (exp.paid_by_id === userId) {
        meTotalPaidAsPayer += amount;
      }

      const categoryKey = exp.category || 'Uncategorized';
      if (!byCategoryMap[categoryKey]) {
        byCategoryMap[categoryKey] = {
          category: categoryKey,
          totalAmount: 0,
          count: 0,
        };
      }
      byCategoryMap[categoryKey].totalAmount += amount;
      byCategoryMap[categoryKey].count += 1;

      const dateKey = exp.date.toISOString().slice(0, 10); // "YYYY-MM-DD"
      if (!byDateMap[dateKey]) {
        byDateMap[dateKey] = {
          date: dateKey,
          totalExpenses: 0,
          expensesCount: 0,
          totalSettlements: 0,
          settlementsCount: 0,
        };
      }
      byDateMap[dateKey].totalExpenses += amount;
      byDateMap[dateKey].expensesCount += 1;

      // top payers
      if (!payerTotals[exp.paid_by_id]) {
        payerTotals[exp.paid_by_id] = 0;
      }
      payerTotals[exp.paid_by_id] += amount;
    }

    // Process settlements
    for (const st of settlements) {
      const amount = Number(st.amount);
      groupTotalSettlements += amount;

      if (st.from_user_id === userId) {
        meTotalSettlementsMade += amount;
      }

      const dateKey = st.date.toISOString().slice(0, 10);
      if (!byDateMap[dateKey]) {
        byDateMap[dateKey] = {
          date: dateKey,
          totalExpenses: 0,
          expensesCount: 0,
          totalSettlements: 0,
          settlementsCount: 0,
        };
      }
      byDateMap[dateKey].totalSettlements += amount;
      byDateMap[dateKey].settlementsCount += 1;
    }

    // Ensure we have entries for all dates in range (even with 0s)
    const cursor = new Date(from.getTime());
    while (cursor <= to) {
      const key = cursor.toISOString().slice(0, 10);
      if (!byDateMap[key]) {
        byDateMap[key] = {
          date: key,
          totalExpenses: 0,
          expensesCount: 0,
          totalSettlements: 0,
          settlementsCount: 0,
        };
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const groupNetOutstanding = groupTotalExpenses - groupTotalSettlements;

    // Build by_category array
    const byCategory = Object.values(byCategoryMap).map((item) => ({
      category: item.category,
      total_amount: item.totalAmount,
      count: item.count,
    }));

    // Build by_date array sorted by date
    const byDate = Object.values(byDateMap)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
      .map((item) => ({
        date: item.date,
        total_expenses: item.totalExpenses,
        expenses_count: item.expensesCount,
        total_settlements: item.totalSettlements,
        settlements_count: item.settlementsCount,
      }));

    // Top payers: fetch user info & sort
    const payerIds = Object.keys(payerTotals);
    let topPayers: {
      user_id: string;
      name: string;
      avatar_url: string | null;
      total_paid: number;
    }[] = [];

    if (payerIds.length > 0) {
      const users = await this.prisma.user.findMany({
        where: { id: { in: payerIds } },
        select: {
          id: true,
          name: true,
          avatar_url: true,
        },
      });

      topPayers = users
        .map((u) => ({
          user_id: u.id,
          name: u.name,
          avatar_url: u.avatar_url,
          total_paid: payerTotals[u.id] ?? 0,
        }))
        .sort((a, b) => b.total_paid - a.total_paid)
        .slice(0, 5); // top 5
    }

    return {
      range: {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
        applied,
      },
      totals: {
        group_total_expenses: groupTotalExpenses,
        group_total_settlements: groupTotalSettlements,
        group_net_outstanding: groupNetOutstanding,
        me_total_expenses_created: meTotalExpensesCreated,
        me_total_paid_as_payer: meTotalPaidAsPayer,
        me_total_settlements_made: meTotalSettlementsMade,
      },
      by_category: byCategory,
      by_date: byDate,
      top_payers: topPayers,
    };
  }
}
