// Demo data seed. Idempotent: users upsert by email, groups by invite_code,
// and each group's expenses/settlements/members are reset then recreated, so
// re-running never duplicates. Run with `pnpm prisma db seed` (Prisma loads
// DATABASE_URL from .env). Login: demo@splibilo.app / demo1234.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const PW = 'demo1234';

const users = [
  { key: 'emma', name: 'Emma Carter', email: 'demo@splibilo.app' },
  { key: 'james', name: 'James Bennett', email: 'james@splibilo.app' },
  { key: 'olivia', name: 'Olivia Hayes', email: 'olivia@splibilo.app' },
  { key: 'liam', name: 'Liam Walsh', email: 'liam@splibilo.app' },
  { key: 'sophie', name: 'Sophie Turner', email: 'sophie@splibilo.app' },
];

// even split with the integer remainder assigned to the payer, so shares sum
// exactly to the amount (the API enforces this too)
function evenShares(amount, memberIds, payerId) {
  const per = Math.floor(amount / memberIds.length);
  const remainder = amount - per * memberIds.length;
  return memberIds.map((id) => ({
    user_id: id,
    amount: id === payerId ? per + remainder : per,
  }));
}

function daysAgo(d) {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t;
}

const groups = [
  {
    code: 'K7M2QP4X',
    name: 'Bali, long weekend',
    description: 'Three nights in Canggu with the crew.',
    category: 'Trip',
    members: ['emma', 'james', 'olivia', 'liam'],
    expenses: [
      { description: 'Villa, 3 nights', amount: 4200000, category: 'Lodging', paidBy: 'emma', daysAgo: 21 },
      { description: 'Airport transfer', amount: 385000, category: 'Transport', paidBy: 'james', daysAgo: 21 },
      { description: 'Groceries first run', amount: 612500, category: 'Groceries', paidBy: 'olivia', daysAgo: 20 },
      { description: 'Dinner at La Baracca', amount: 928000, category: 'Food', paidBy: 'liam', daysAgo: 20 },
      { description: 'Scooter rental x2', amount: 300000, category: 'Transport', paidBy: 'emma', daysAgo: 19 },
      { description: 'Beach club day', amount: 1540000, category: 'Entertainment', paidBy: 'james', daysAgo: 19 },
      { description: 'Surf lesson', amount: 750000, category: 'Entertainment', paidBy: 'olivia', daysAgo: 18 },
    ],
    settlements: [{ from: 'liam', to: 'emma', amount: 500000, notes: 'partial, rest later' }],
  },
  {
    code: 'R9T5WLZ2',
    name: 'Apartment 4B',
    description: 'Shared flat running costs.',
    category: 'Household',
    members: ['emma', 'olivia', 'sophie'],
    expenses: [
      { description: 'Electricity, October', amount: 487000, category: 'Utilities', paidBy: 'emma', daysAgo: 12 },
      { description: 'Internet, October', amount: 360000, category: 'Utilities', paidBy: 'olivia', daysAgo: 12 },
      { description: 'Weekly groceries', amount: 528500, category: 'Groceries', paidBy: 'sophie', daysAgo: 9 },
      { description: 'Cleaning supplies', amount: 143000, category: 'Household', paidBy: 'emma', daysAgo: 6 },
      { description: 'Water refill x5', amount: 95000, category: 'Utilities', paidBy: 'olivia', daysAgo: 3 },
    ],
    settlements: [],
  },
  {
    code: 'H3N8VYC6',
    name: 'Friday futsal',
    description: 'Court, drinks, the usual.',
    category: 'Sports',
    members: ['emma', 'james', 'liam', 'sophie'],
    expenses: [
      { description: 'Court booking', amount: 320000, category: 'Sports', paidBy: 'liam', daysAgo: 14 },
      { description: 'Isotonic drinks', amount: 88000, category: 'Food', paidBy: 'emma', daysAgo: 14 },
      { description: 'Court booking', amount: 320000, category: 'Sports', paidBy: 'james', daysAgo: 7 },
      { description: 'Post-game satay', amount: 264000, category: 'Food', paidBy: 'sophie', daysAgo: 7 },
    ],
    settlements: [],
  },
];

async function main() {
  const password = await bcrypt.hash(PW, 10);

  const id = {}; // key -> user id
  for (const u of users) {
    const row = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { email: u.email, name: u.name, password, role: 'USER' },
    });
    id[u.key] = row.id;
    console.log(`user ${u.name} <${u.email}>`);
  }

  for (const g of groups) {
    const group = await prisma.group.upsert({
      where: { invite_code: g.code },
      update: { name: g.name, description: g.description, category: g.category },
      create: {
        name: g.name,
        description: g.description,
        category: g.category,
        invite_code: g.code,
      },
    });

    // Reset this group's data so re-running is clean (children first).
    await prisma.expenseShare.deleteMany({ where: { expense: { group_id: group.id } } });
    await prisma.expense.deleteMany({ where: { group_id: group.id } });
    await prisma.settlement.deleteMany({ where: { group_id: group.id } });
    await prisma.groupMember.deleteMany({ where: { group_id: group.id } });

    await prisma.groupMember.createMany({
      data: g.members.map((key, i) => ({
        group_id: group.id,
        user_id: id[key],
        role: i === 0 ? 'OWNER' : 'MEMBER',
      })),
    });

    const memberIds = g.members.map((k) => id[k]);
    for (const e of g.expenses) {
      const payerId = id[e.paidBy];
      await prisma.expense.create({
        data: {
          group_id: group.id,
          created_by_id: payerId,
          paid_by_id: payerId,
          description: e.description,
          amount: e.amount,
          category: e.category,
          date: daysAgo(e.daysAgo),
          expense_shares: { create: evenShares(e.amount, memberIds, payerId) },
        },
      });
    }

    for (const s of g.settlements) {
      await prisma.settlement.create({
        data: {
          group_id: group.id,
          from_user_id: id[s.from],
          to_user_id: id[s.to],
          amount: s.amount,
          notes: s.notes,
          date: daysAgo(1),
        },
      });
    }

    console.log(`group ${g.name}: ${g.members.length} members, ${g.expenses.length} expenses`);
  }

  console.log('\nDONE. Log in as demo@splibilo.app / demo1234');
}

main()
  .catch((e) => {
    console.error('SEED FAILED:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
