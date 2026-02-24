import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface BalanceEdge {
  fromUserId: string; // debtor
  toUserId: string; // creditor
  amount: number;
}

@Injectable()
export class GroupBalanceService {
  constructor(private readonly prisma: PrismaService) {}

  private zero(): Prisma.Decimal {
    return new Prisma.Decimal(0);
  }

  /**
   * Net balance per user in a group.
   * Positive => others owe this user.
   * Negative => this user owes others.
   */
  async getNetByUser(groupId: string): Promise<Record<string, Prisma.Decimal>> {
    const members = await this.prisma.groupMember.findMany({
      where: { group_id: groupId },
      select: { user_id: true },
    });

    if (!members.length) return {};

    const net: Record<string, Prisma.Decimal> = {};
    for (const { user_id } of members) {
      net[user_id] = this.zero();
    }

    // Apply expenses + shares
    const expenses = await this.prisma.expense.findMany({
      where: { group_id: groupId },
      include: { expense_shares: true },
    });

    for (const expense of expenses) {
      // payer fronted the full amount
      net[expense.paid_by_id] = (net[expense.paid_by_id] ?? this.zero()).add(
        expense.amount,
      );

      // each participant owes their share
      for (const share of expense.expense_shares) {
        net[share.user_id] = (net[share.user_id] ?? this.zero()).sub(
          share.amount,
        );
      }
    }

    // Apply settlements (actual payments between users)
    const settlements = await this.prisma.settlement.findMany({
      where: { group_id: groupId },
    });

    for (const st of settlements) {
      // from_user paid out → their net moves towards 0 (less debt)
      net[st.from_user_id] = (net[st.from_user_id] ?? this.zero()).add(
        st.amount,
      );
      // to_user received money → their net moves towards 0 (less receivable)
      net[st.to_user_id] = (net[st.to_user_id] ?? this.zero()).sub(st.amount);
    }

    return net;
  }

  /**
   * Turn net balances into pairwise edges "from owes to amount".
   * Uses a greedy matching algorithm.
   */
  async getEdges(groupId: string): Promise<BalanceEdge[]> {
    const net = await this.getNetByUser(groupId);

    const debtors: { userId: string; amount: Prisma.Decimal }[] = [];
    const creditors: { userId: string; amount: Prisma.Decimal }[] = [];

    for (const [userId, value] of Object.entries(net)) {
      if (value.lt(0)) {
        debtors.push({ userId, amount: value.neg() }); // owes
      } else if (value.gt(0)) {
        creditors.push({ userId, amount: value }); // is owed
      }
    }

    const edges: BalanceEdge[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const d = debtors[i];
      const c = creditors[j];

      const pay = Prisma.Decimal.min(d.amount, c.amount);

      edges.push({
        fromUserId: d.userId,
        toUserId: c.userId,
        amount: pay.toNumber(),
      });

      d.amount = d.amount.sub(pay);
      c.amount = c.amount.sub(pay);

      if (d.amount.lte(0)) i++;
      if (c.amount.lte(0)) j++;
    }

    return edges;
  }

  /**
   * Debt from fromUserId → toUserId after simplification.
   * If there's no edge, returns 0.
   */
  async getDebtBetween(
    groupId: string,
    fromUserId: string,
    toUserId: string,
  ): Promise<number> {
    const edges = await this.getEdges(groupId);
    const edge = edges.find(
      (e) => e.fromUserId === fromUserId && e.toUserId === toUserId,
    );
    return edge?.amount ?? 0;
  }
}
