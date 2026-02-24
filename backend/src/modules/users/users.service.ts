import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { Prisma, UserRole } from '@prisma/client';
import { UserActivityQueryDto } from './dto/user-activity-query.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- SELF / ME ----------

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        role: true,
        is_suspended: true,
        email_on_settlement_received: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.avatarUrl !== undefined) {
      data.avatar_url = dto.avatarUrl;
    }

    if (dto.emailOnSettlementReceived !== undefined) {
      data.email_on_settlement_received = dto.emailOnSettlementReceived;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        role: true,
        is_suspended: true,
        email_on_settlement_received: true,
        created_at: true,
      },
    });

    return user;
  }

  private parseActivityRange(query: UserActivityQueryDto) {
    let from: Date;
    let to: Date;
    let applied = false;

    if (query.from && query.to) {
      // Expect "YYYY-MM-DD"
      from = new Date(`${query.from}T00:00:00.000Z`);
      to = new Date(`${query.to}T23:59:59.999Z`);
      applied = true;
    } else {
      // Default: last ~6 months, starting from the 1st of month
      const now = new Date();
      to = now;
      from = new Date(now);
      from.setMonth(from.getMonth() - 5);
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      applied = false;
    }

    if (from > to) {
      throw new BadRequestException('Invalid date range');
    }

    return { from, to, applied };
  }

  async getMyActivity(userId: string, query: UserActivityQueryDto) {
    const { from, to, applied } = this.parseActivityRange(query);

    // Load all expenses involving this user within window
    const [expenses, settlements] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where: {
          date: { gte: from, lte: to },
          OR: [
            { created_by_id: userId },
            { expense_shares: { some: { user_id: userId } } },
          ],
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              icon_url: true,
            },
          },
          created_by: {
            select: {
              id: true,
              name: true,
            },
          },
          paid_by: {
            select: {
              id: true,
              name: true,
            },
          },
          expense_shares: {
            where: {
              user_id: userId,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      this.prisma.settlement.findMany({
        where: {
          date: { gte: from, lte: to },
          OR: [{ from_user_id: userId }, { to_user_id: userId }],
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              icon_url: true,
            },
          },
          from_user: {
            select: {
              id: true,
              name: true,
            },
          },
          to_user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    // Helper: month key YYYY-MM
    const monthKey = (d: Date) => {
      const y = d.getUTCFullYear();
      const m = `${d.getUTCMonth() + 1}`.padStart(2, '0');
      return `${y}-${m}`;
    };

    // Aggregation containers
    const expensesInvolvingMe: any[] = [];
    const settlementsInvolvingMe: any[] = [];

    const categoryMap: Record<string, { category: string; total: number }> = {};

    const monthlyMap: Record<
      string,
      {
        month: string; // YYYY-MM
        totalExpenseShare: number; // your share of expenses in that month
        totalSettlementsOut: number; // you paid others
        totalSettlementsIn: number; // others paid you
      }
    > = {};

    const groupMap: Record<
      string,
      {
        groupId: string;
        groupName: string | null;
        totalExpenseShare: number;
        totalSettlementsOut: number;
        totalSettlementsIn: number;
        expensesCount: number;
        settlementsCount: number;
      }
    > = {};

    let myTotalExpenseShare = 0;
    let myTotalSettlementsOut = 0;
    let myTotalSettlementsIn = 0;

    // Seed monthly buckets for each month in the window
    const seedCursor = new Date(from.getTime());
    seedCursor.setUTCDate(1);
    seedCursor.setUTCHours(0, 0, 0, 0);
    while (seedCursor <= to) {
      const key = monthKey(seedCursor);
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: key,
          totalExpenseShare: 0,
          totalSettlementsOut: 0,
          totalSettlementsIn: 0,
        };
      }
      seedCursor.setUTCMonth(seedCursor.getUTCMonth() + 1);
    }

    // 2) Process expenses involving you
    for (const exp of expenses) {
      const totalAmount = (exp.amount as Prisma.Decimal).toNumber();
      const myShareDecimal = exp.expense_shares[0]?.amount as
        | Prisma.Decimal
        | undefined;
      const myShare = myShareDecimal ? myShareDecimal.toNumber() : 0;

      const gId = exp.group?.id ?? exp.group_id;
      const gName = exp.group?.name ?? null;

      // Push to list
      expensesInvolvingMe.push({
        id: exp.id,
        groupId: gId,
        groupName: gName,
        description: exp.description,
        category: exp.category,
        date: exp.date,
        totalAmount,
        createdById: exp.created_by_id,
        createdByName: exp.created_by?.name ?? null,
        paidById: exp.paid_by_id,
        paidByName: exp.paid_by?.name ?? null,
        myShareAmount: myShare,
      });

      // Category breakdown (only your share)
      if (myShare > 0) {
        const cKey = exp.category || 'Uncategorized';
        if (!categoryMap[cKey]) {
          categoryMap[cKey] = { category: cKey, total: 0 };
        }
        categoryMap[cKey].total += myShare;
        myTotalExpenseShare += myShare;
      }

      // Monthly activity (only your share)
      if (myShare > 0) {
        const mk = monthKey(exp.date);
        if (!monthlyMap[mk]) {
          monthlyMap[mk] = {
            month: mk,
            totalExpenseShare: 0,
            totalSettlementsOut: 0,
            totalSettlementsIn: 0,
          };
        }
        monthlyMap[mk].totalExpenseShare += myShare;
      }

      // Group involvement
      if (!groupMap[gId]) {
        groupMap[gId] = {
          groupId: gId,
          groupName: gName,
          totalExpenseShare: 0,
          totalSettlementsOut: 0,
          totalSettlementsIn: 0,
          expensesCount: 0,
          settlementsCount: 0,
        };
      }
      groupMap[gId].expensesCount += 1;
      groupMap[gId].totalExpenseShare += myShare;
    }

    // 3) Process settlements involving you
    for (const st of settlements) {
      const amount = (st.amount as Prisma.Decimal).toNumber();
      const direction = st.from_user_id === userId ? 'outgoing' : 'incoming';
      const gId = st.group?.id ?? st.group_id;
      const gName = st.group?.name ?? null;

      settlementsInvolvingMe.push({
        id: st.id,
        groupId: gId,
        groupName: gName,
        date: st.date,
        amount,
        fromUserId: st.from_user_id,
        fromUserName: st.from_user?.name ?? null,
        toUserId: st.to_user_id,
        toUserName: st.to_user?.name ?? null,
        direction, // 'outgoing' or 'incoming'
      });

      const mk = monthKey(st.date);
      if (!monthlyMap[mk]) {
        monthlyMap[mk] = {
          month: mk,
          totalExpenseShare: 0,
          totalSettlementsOut: 0,
          totalSettlementsIn: 0,
        };
      }

      if (direction === 'outgoing') {
        monthlyMap[mk].totalSettlementsOut += amount;
        myTotalSettlementsOut += amount;
      } else {
        monthlyMap[mk].totalSettlementsIn += amount;
        myTotalSettlementsIn += amount;
      }

      if (!groupMap[gId]) {
        groupMap[gId] = {
          groupId: gId,
          groupName: gName,
          totalExpenseShare: 0,
          totalSettlementsOut: 0,
          totalSettlementsIn: 0,
          expensesCount: 0,
          settlementsCount: 0,
        };
      }
      groupMap[gId].settlementsCount += 1;
      if (direction === 'outgoing') {
        groupMap[gId].totalSettlementsOut += amount;
      } else {
        groupMap[gId].totalSettlementsIn += amount;
      }
    }

    // 4) Build final structures

    const categoryBreakdown = Object.values(categoryMap).map((c) => ({
      category: c.category,
      total_amount: c.total,
    }));

    const monthlyActivity = Object.values(monthlyMap)
      .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0))
      .map((m) => ({
        month: m.month,
        my_expense_share: m.totalExpenseShare,
        my_settlements_out: m.totalSettlementsOut,
        my_settlements_in: m.totalSettlementsIn,
      }));

    const topGroups = Object.values(groupMap)
      .map((g) => ({
        group_id: g.groupId,
        group_name: g.groupName,
        total_expense_share: g.totalExpenseShare,
        total_settlements_out: g.totalSettlementsOut,
        total_settlements_in: g.totalSettlementsIn,
        expenses_count: g.expensesCount,
        settlements_count: g.settlementsCount,
        total_activity_score:
          g.totalExpenseShare + g.totalSettlementsOut + g.totalSettlementsIn,
      }))
      .sort((a, b) => b.total_activity_score - a.total_activity_score)
      .slice(0, 5);

    const myNetPosition =
      myTotalSettlementsIn + myTotalExpenseShare - myTotalSettlementsOut;

    return {
      period: {
        from,
        to,
        applied,
      },
      totals: {
        my_total_expense_share: myTotalExpenseShare,
        my_total_settlements_out: myTotalSettlementsOut,
        my_total_settlements_in: myTotalSettlementsIn,
        my_net_position: myNetPosition,
      },
      expenses_involving_me: expensesInvolvingMe,
      settlements_involving_me: settlementsInvolvingMe,
      category_breakdown: categoryBreakdown,
      monthly_activity: monthlyActivity,
      top_groups: topGroups,
    };
  }

  // ---------- ADMIN ----------

  private ensureAdmin(role: UserRole) {
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can perform this action');
    }
  }

  async listUsersAsAdmin(query: UsersQueryDto, actingRole: UserRole) {
    this.ensureAdmin(actingRole);

    const where: Prisma.UserWhereInput = {
      ...(query.search
        ? {
            OR: [
              {
                name: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      role: UserRole.USER,
      ...(typeof query.isSuspended !== 'undefined'
        ? {
            is_suspended: query.isSuspended === 'true',
          }
        : {}),
    };

    if (query.disablePagination) {
      const users = await this.prisma.user.findMany({
        where,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          avatar_url: true,
          role: true,
          is_suspended: true,
          email_on_settlement_received: true,
          created_at: true,
        },
      });

      return {
        data: users,
      };
    }

    const [users, count] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: query.offset,
        take: query.limit,
        select: {
          id: true,
          email: true,
          name: true,
          avatar_url: true,
          role: true,
          is_suspended: true,
          email_on_settlement_received: true,
          created_at: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: query.toMeta(count),
    };
  }

  async getUserDetailAsAdmin(userId: string, actingRole: UserRole) {
    this.ensureAdmin(actingRole);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        role: true,
        is_suspended: true,
        email_on_settlement_received: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserAsAdmin(
    userId: string,
    dto: UpdateUserAdminDto,
    actingRole: UserRole,
  ) {
    this.ensureAdmin(actingRole);

    const data: Prisma.UserUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.role !== undefined) {
      data.role = dto.role;
    }

    if (dto.isSuspended !== undefined) {
      data.is_suspended = dto.isSuspended;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        avatar_url: true,
        role: true,
        is_suspended: true,
        email_on_settlement_received: true,
        created_at: true,
      },
    });

    return user;
  }
}
