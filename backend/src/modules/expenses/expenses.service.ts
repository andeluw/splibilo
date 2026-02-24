import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesQueryDto } from './dto/expenses-query.dto';
import { GroupRole, Prisma } from '@prisma/client';
import { AdminExpensesQueryDto } from './dto/admin-expenses-query.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) { }

  private async ensureGroupMember(groupId: string, userId: string) {
    const membership = await this.prisma.groupMember.findFirst({
      where: { group_id: groupId, user_id: userId },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this group');
    }

    return membership;
  }

  private async getGroupWithSettings(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        is_locked: true,
        members_can_edit_all_expenses: true,
        members_can_delete_expenses: true,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  private ensureCanCreate(group: { is_locked: boolean }) {
    if (group.is_locked) {
      throw new ForbiddenException('Group is locked. Cannot create expenses.');
    }
  }

  private ensureCanModify(
    action: 'edit' | 'delete',
    group: {
      members_can_edit_all_expenses: boolean;
      members_can_delete_expenses: boolean;
    },
    membership: { role: GroupRole },
    expense: { created_by_id: string },
    userId: string,
  ) {
    const isOwner = membership.role === GroupRole.OWNER;
    const isCreator = expense.created_by_id === userId;

    if (isCreator || isOwner) {
      return;
    }

    if (action === 'edit' && group.members_can_edit_all_expenses) {
      return;
    }

    if (action === 'delete' && group.members_can_delete_expenses) {
      return;
    }

    throw new ForbiddenException(
      `You do not have permission to ${action} this expense`,
    );
  }

  async createExpense(groupId: string, userId: string, dto: CreateExpenseDto) {
    const [group, _membership] = await Promise.all([
      this.getGroupWithSettings(groupId),
      this.ensureGroupMember(groupId, userId),
    ]);

    this.ensureCanCreate(group);

    // Ensure paidByUserId is a member of the group
    const paidByMembership = await this.prisma.groupMember.findFirst({
      where: {
        group_id: groupId,
        user_id: dto.paidByUserId,
      },
    });

    if (!paidByMembership) {
      throw new BadRequestException(
        'Paid by user is not a member of this group',
      );
    }

    // Validate shares sum
    const totalShares = dto.shares.reduce(
      (sum, share) => sum + share.amount,
      0,
    );

    if (Math.abs(totalShares - dto.amount) > 1e-6) {
      throw new BadRequestException(
        'Total shares amount must equal expense amount',
      );
    }

    // Create expense + shares in a transaction
    const expense = await this.prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          group_id: groupId,
          created_by_id: userId,
          description: dto.description,
          amount: dto.amount,
          category: dto.category,
          date: new Date(dto.date),
          paid_by_id: dto.paidByUserId,
          receipt_url: dto.receiptUrl,
          notes: dto.notes,
          expense_shares: {
            create: dto.shares.map((s) => ({
              user_id: s.userId,
              amount: s.amount,
            })),
          },
        },
        include: {
          expense_shares: true,
        },
      });

      return created;
    });

    return expense;
  }

  async listExpenses(groupId: string, userId: string, query: ExpensesQueryDto) {
    await this.ensureGroupMember(groupId, userId);

    const where: Prisma.ExpenseWhereInput = {
      group_id: groupId,
      ...(query.search
        ? {
          description: {
            contains: query.search,
            mode: 'insensitive',
          },
        }
        : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.paidByUserId ? { paid_by_id: query.paidByUserId } : {}),
      ...(query.minAmount !== undefined || query.maxAmount !== undefined
        ? {
          amount: {
            ...(query.minAmount !== undefined
              ? { gte: query.minAmount }
              : {}),
            ...(query.maxAmount !== undefined
              ? { lte: query.maxAmount }
              : {}),
          },
        }
        : {}),
      ...(query.startDate || query.endDate
        ? {
          date: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
        : {}),
    };

    const orderBy: Prisma.ExpenseOrderByWithRelationInput = {
      date: 'desc',
    };

    if (query.disablePagination) {
      const expenses = await this.prisma.expense.findMany({
        where,
        orderBy,
        include: {
          created_by: {
            select: { id: true, name: true, email: true },
          },
          paid_by: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return {
        data: expenses,
      };
    }

    const [expenses, count] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        orderBy,
        skip: query.offset,
        take: query.limit,
        include: {
          created_by: {
            select: { id: true, name: true, email: true },
          },
          paid_by: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data: expenses,
      meta: query.toMeta(count),
    };
  }

  async getExpenseDetail(groupId: string, expenseId: string, userId: string) {
    await this.ensureGroupMember(groupId, userId);

    const expense = await this.prisma.expense.findFirst({
      where: {
        id: expenseId,
        group_id: groupId,
      },
      include: {
        created_by: {
          select: { id: true, name: true, email: true },
        },
        paid_by: {
          select: { id: true, name: true, email: true },
        },
        expense_shares: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async updateExpense(
    groupId: string,
    expenseId: string,
    userId: string,
    dto: UpdateExpenseDto,
  ) {
    const [group, membership, expense] = await Promise.all([
      this.getGroupWithSettings(groupId),
      this.ensureGroupMember(groupId, userId),
      this.prisma.expense.findFirst({
        where: { id: expenseId, group_id: groupId },
        include: {
          expense_shares: true,
        },
      }),
    ]);

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    this.ensureCanModify('edit', group, membership, expense, userId);

    const hasAmount = dto.amount !== undefined && dto.amount !== null;
    const shares = dto.shares ?? [];
    const hasShares = shares.length > 0;

    // Case 1: amount + shares provided → sum(shares) must equal new amount
    if (hasAmount && hasShares) {
      const totalShares = shares.reduce(
        (sum, share) => sum + Number(share.amount),
        0,
      );
      const newAmount = Number(dto.amount);

      if (Math.abs(totalShares - newAmount) > 1e-6) {
        throw new BadRequestException(
          'Total shares amount must equal expense amount',
        );
      }
    }

    // Case 2: only shares provided → sum(shares) must equal existing amount
    if (!hasAmount && hasShares) {
      const totalShares = shares.reduce(
        (sum, share) => sum + Number(share.amount),
        0,
      );
      const existingAmount = Number(expense.amount);

      if (Math.abs(totalShares - existingAmount) > 1e-6) {
        throw new BadRequestException(
          'Total shares amount must equal current expense amount',
        );
      }
    }

    // Case 3: only amount provided → new amount must equal sum(existing shares)
    if (hasAmount && !hasShares) {
      const totalShares = expense.expense_shares.reduce(
        (sum, share) => sum + Number(share.amount),
        0,
      );
      const newAmount = Number(dto.amount);

      if (Math.abs(totalShares - newAmount) > 1e-6) {
        throw new BadRequestException(
          'Expense amount must match existing total shares. If you want to change the split, send updated shares too.',
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedExpense = await tx.expense.update({
        where: { id: expenseId },
        data: {
          description: dto.description ?? expense.description,
          amount: hasAmount ? dto.amount : expense.amount,
          category: dto.category ?? expense.category,
          date: dto.date ? new Date(dto.date) : expense.date,
          paid_by_id: dto.paidByUserId ?? expense.paid_by_id,
          receipt_url: dto.receiptUrl
            ? dto.receiptUrl
            : expense.receipt_url != null && dto.receiptUrl == null
              ? null
              : expense.receipt_url,
          notes: dto.notes ?? expense.notes,
        },
      });

      if (hasShares) {
        await tx.expenseShare.deleteMany({
          where: { expense_id: expenseId },
        });

        await tx.expenseShare.createMany({
          data: shares.map((s) => ({
            expense_id: expenseId,
            user_id: s.userId,
            amount: s.amount,
          })),
        });
      }

      return updatedExpense;
    });

    return updated;
  }

  async deleteExpense(groupId: string, expenseId: string, userId: string) {
    const [group, membership, expense] = await Promise.all([
      this.getGroupWithSettings(groupId),
      this.ensureGroupMember(groupId, userId),
      this.prisma.expense.findFirst({
        where: { id: expenseId, group_id: groupId },
      }),
    ]);

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    this.ensureCanModify('delete', group, membership, expense, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.expenseShare.deleteMany({
        where: { expense_id: expenseId },
      });

      await tx.expense.delete({
        where: { id: expenseId },
      });
    });

    return { success: true };
  }

  // ADMIN
  async listAllExpensesAsAdmin(query: AdminExpensesQueryDto) {
    const where: Prisma.ExpenseWhereInput = {
      ...(query.groupId ? { group_id: query.groupId } : {}),
      ...(query.search
        ? {
          description: {
            contains: query.search,
            mode: 'insensitive',
          },
        }
        : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.paidByUserId ? { paid_by_id: query.paidByUserId } : {}),
      ...(query.minAmount !== undefined || query.maxAmount !== undefined
        ? {
          amount: {
            ...(query.minAmount !== undefined
              ? { gte: query.minAmount }
              : {}),
            ...(query.maxAmount !== undefined
              ? { lte: query.maxAmount }
              : {}),
          },
        }
        : {}),
      ...(query.startDate || query.endDate
        ? {
          date: {
            ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
            ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
          },
        }
        : {}),
      ...(query.hasReceipt !== undefined
        ? query.hasReceipt
          ? { NOT: { receipt_url: null } }
          : { receipt_url: null }
        : {}),
    };

    const orderBy: Prisma.ExpenseOrderByWithRelationInput = {
      date: 'desc',
    };

    if (query.disablePagination) {
      const expenses = await this.prisma.expense.findMany({
        where,
        orderBy,
        include: {
          group: {
            select: { id: true, name: true },
          },
          created_by: {
            select: { id: true, name: true, email: true },
          },
          paid_by: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return {
        data: expenses,
      };
    }

    const page = query.page && query.page > 0 ? query.page : 1;
    const perPage = query.perPage && query.perPage > 0 ? query.perPage : 10;
    const shouldPaginate = !query.disablePagination;

    const [expenses, count] = await this.prisma.$transaction([
      this.prisma.expense.findMany({
        where,
        orderBy,
        ...(shouldPaginate
          ? {
            skip: (page - 1) * perPage,
            take: perPage,
          }
          : {}),
        include: {
          group: {
            select: { id: true, name: true },
          },
          created_by: {
            select: { id: true, name: true, email: true },
          },
          paid_by: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.expense.count({ where }),
    ]);

    return {
      data: expenses,
      ...(shouldPaginate ? { meta: query.toMeta(count) } : {}),
    };
  }

  async getExpenseDetailAsAdmin(expenseId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        group: {
          select: { id: true, name: true },
        },
        created_by: {
          select: { id: true, name: true, email: true },
        },
        paid_by: {
          select: { id: true, name: true, email: true },
        },
        expense_shares: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    return expense;
  }

  async removeReceiptAsAdmin(expenseId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      select: { id: true, receipt_url: true },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (!expense.receipt_url) {
      return { success: true };
    }

    await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        receipt_url: null,
      },
    });

    return { success: true };
  }
}
