// app/(app)/activity/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { format as formatDate, subDays, subMonths } from 'date-fns';
import { ChevronRight, UsersIcon } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from 'recharts';

import api from '@/lib/api';
import { getCategoryColor } from '@/lib/category-color';
import { numberToCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';

import { Button } from '@/components/button';
import { ButtonLink } from '@/components/button-link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/chart';
import withAuth from '@/components/hoc/withAuth';
import UserLayout from '@/components/layout/user/user-layout';
import { Typography } from '@/components/typography';

import type { ApiResponse } from '@/types/api';

// ===== Types =====
type UserActivityTotals = {
  my_total_expense_share: number;
  my_total_settlements_out: number;
  my_total_settlements_in: number;
  my_net_position: number;
};

type UserActivityExpenseItem = {
  id: string;
  group_id: string;
  group_name: string;
  description: string;
  category: string | null;
  date: string;
  total_amount: number;
  created_by_id: string;
  created_by_name: string;
  paid_by_id: string;
  paid_by_name: string;
  my_share_amount: number;
};

type UserActivitySettlementItem = {
  id: string;
  group_id: string;
  group_name: string;
  date: string;
  amount: number;
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  direction: 'incoming' | 'outgoing';
};

type UserActivityCategoryBreakdown = {
  category: string | null;
  total_amount: number;
};

type UserActivityMonthly = {
  month: string; // yyyy-MM
  my_expense_share: number;
  my_settlements_out: number;
  my_settlements_in: number;
};

type UserActivityTopGroup = {
  group_id: string;
  group_name: string;
  total_expense_share: number;
  total_settlements_out: number;
  total_settlements_in: number;
  expenses_count: number;
  settlements_count: number;
  total_activity_score: number;
};

type UserActivityPeriod = {
  from: string;
  to: string;
  applied: boolean;
};

type UserActivity = {
  period: UserActivityPeriod;
  totals: UserActivityTotals;
  expenses_involving_me: UserActivityExpenseItem[];
  settlements_involving_me: UserActivitySettlementItem[];
  category_breakdown: UserActivityCategoryBreakdown[];
  monthly_activity: UserActivityMonthly[];
  top_groups: UserActivityTopGroup[];
};

type RangePreset = '7d' | '1m' | '3m' | '6m';

// ===== Helpers =====
function formatMonthLabel(month: string) {
  // month: "2025-12"
  try {
    const d = new Date(`${month}-01T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return month;
    return formatDate(d, 'MMM yyyy');
  } catch {
    return month;
  }
}

// ===== Page =====
export default withAuth(UserActivityPage, 'user');
function UserActivityPage() {
  const [rangePreset, setRangePreset] = React.useState<RangePreset>('3m');

  const today = React.useMemo(() => new Date(), []);

  const { rangeFrom, rangeTo } = React.useMemo(() => {
    const to = formatDate(today, 'yyyy-MM-dd');

    if (rangePreset === '7d') {
      const from = formatDate(subDays(today, 6), 'yyyy-MM-dd');
      return { rangeFrom: from, rangeTo: to };
    }

    if (rangePreset === '1m') {
      const from = formatDate(subMonths(today, 1), 'yyyy-MM-dd');
      return { rangeFrom: from, rangeTo: to };
    }

    if (rangePreset === '3m') {
      const from = formatDate(subMonths(today, 3), 'yyyy-MM-dd');
      return { rangeFrom: from, rangeTo: to };
    }

    // 6m
    const from = formatDate(subMonths(today, 6), 'yyyy-MM-dd');
    return { rangeFrom: from, rangeTo: to };
  }, [rangePreset, today]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-activity', rangePreset, rangeFrom, rangeTo],
    queryFn: async () => {
      const res = await api.get<ApiResponse<UserActivity>>('/user/activity', {
        params: {
          from: rangeFrom,
          to: rangeTo,
        },
      });
      return res.data.data;
    },
  });

  return (
    <UserLayout>
      <section className='flex flex-col gap-6'>
        <header className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='space-y-1'>
            <Typography as='h1' variant='h1' className='text-primary-800 dark:text-primary-200'>
              Your activity
            </Typography>
            <Typography variant='b3' className='text-muted-foreground'>
              See how your own expenses and settlements add up across all
              groups.
            </Typography>
          </div>

          {/* Range selector */}
          <div className='inline-flex items-center rounded-full border bg-muted/60 p-1 text-xs'>
            <Button
              type='button'
              size='sm'
              variant={rangePreset === '7d' ? 'primary' : 'ghostblack'}
              className={cn('h-7 rounded-full px-3 text-xs')}
              onClick={() => setRangePreset('7d')}
            >
              Last week
            </Button>
            <Button
              type='button'
              size='sm'
              variant={rangePreset === '1m' ? 'primary' : 'ghostblack'}
              className={cn('h-7 rounded-full px-3 text-xs')}
              onClick={() => setRangePreset('1m')}
            >
              Last month
            </Button>
            <Button
              type='button'
              size='sm'
              variant={rangePreset === '3m' ? 'primary' : 'ghostblack'}
              className={cn('h-7 rounded-full px-3 text-xs')}
              onClick={() => setRangePreset('3m')}
            >
              Last 3 months
            </Button>
            <Button
              type='button'
              size='sm'
              variant={rangePreset === '6m' ? 'primary' : 'ghostblack'}
              className={cn('h-7 rounded-full px-3 text-xs')}
              onClick={() => setRangePreset('6m')}
            >
              Last 6 months
            </Button>
          </div>
        </header>

        {isLoading && (
          <Card>
            <CardContent className='py-10'>
              <Typography variant='c1' className='text-muted-foreground'>
                Loading your activity…
              </Typography>
            </CardContent>
          </Card>
        )}

        {isError && !isLoading && (
          <Card>
            <CardContent className='py-10'>
              <Typography variant='c1' className='text-destructive'>
                Could not load your activity. Please try again later.
              </Typography>
            </CardContent>
          </Card>
        )}

        {!isLoading && !isError && data && (
          <div className='grid gap-4 xl:grid-cols-[1.7fr,1.3fr]'>
            <div className='flex flex-col gap-4'>
              <NetPositionCard period={data.period} totals={data.totals} />

              <ActivityAnalyticsCard
                period={data.period}
                totals={data.totals}
                monthly={data.monthly_activity}
                categories={data.category_breakdown}
              />

              <RecentActivityCard
                expenses={data.expenses_involving_me}
                settlements={data.settlements_involving_me}
              />
            </div>

            <div className='flex flex-col gap-4'>
              <TopGroupsCard topGroups={data.top_groups} />

              <QuickStatsCard totals={data.totals} />
            </div>
          </div>
        )}
      </section>
    </UserLayout>
  );
}

// ===== Net position card (overall balance) =====
type NetPositionCardProps = {
  period: UserActivityPeriod;
  totals: UserActivityTotals;
};

function NetPositionCard({ period, totals }: NetPositionCardProps) {
  const net = totals.my_net_position;
  const balanceState = net < 0 ? 'debt' : net > 0 ? 'credit' : 'settled';

  const label =
    net < 0
      ? `You owe ${numberToCurrency(Math.abs(net))}`
      : net > 0
        ? `You are owed ${numberToCurrency(net)}`
        : 'All settled across your groups';

  const subLabel =
    net < 0
      ? 'This is your overall position across all groups in this period.'
      : net > 0
        ? 'This is what others still owe you across all groups in this period.'
        : 'Everyone is fully settled in this period.';

  const fromLabel = formatDate(new Date(period.from), 'd MMM yyyy');
  const toLabel = formatDate(new Date(period.to), 'd MMM yyyy');

  return (
    <Card
      className={cn(
        'shadow-sm',
        balanceState === 'credit' && 'bg-credit-soft border',
        balanceState === 'debt' && 'bg-owed-soft border',
        balanceState === 'settled' &&
          'border-primary-100/70 bg-primary-50/50 dark:border-primary-900/40 dark:bg-primary-950/20',
      )}
    >
      <CardHeader className='flex flex-row items-start justify-between gap-3'>
        <div>
          <CardTitle>Your overall position</CardTitle>
          <Typography variant='b2' className='text-muted-foreground font-semibold'>
            From {fromLabel} to {toLabel}
          </Typography>
          <Typography variant='b3' className='text-muted-foreground'>
            This reflects your share of expenses and your settlements in your
            groups. It does not include the full bills you paid.
          </Typography>
        </div>
      </CardHeader>
      <CardContent>
        <Typography
          variant='s1'
          className={cn(
            'font-semibold',
            balanceState === 'debt' && 'text-owed',
            balanceState === 'credit' && 'text-credit',
            balanceState === 'settled' &&
              'text-primary-700 dark:text-primary-200',
          )}
        >
          {label}
        </Typography>
        <Typography variant='b3' className='mt-1 text-muted-foreground'>
          {subLabel}
        </Typography>

        <div className='mt-4 grid gap-3 sm:grid-cols-3'>
          <div className='rounded-lg border bg-background px-4 py-3'>
            <Typography
              variant='c1'
              className='text-muted-foreground'
            >
              Your expense share
            </Typography>
            <Typography variant='s2' className='mt-1 font-semibold'>
              {numberToCurrency(totals.my_total_expense_share)}
            </Typography>
          </div>
          <div className='rounded-lg border bg-background px-4 py-3'>
            <Typography
              variant='c1'
              className='text-muted-foreground'
            >
              Settlements you paid
            </Typography>
            <Typography variant='s2' className='mt-1 font-semibold'>
              {numberToCurrency(totals.my_total_settlements_out)}
            </Typography>
          </div>
          <div className='rounded-lg border bg-background px-4 py-3'>
            <Typography
              variant='c1'
              className='text-muted-foreground'
            >
              Settlements you received
            </Typography>
            <Typography variant='s2' className='mt-1 font-semibold'>
              {numberToCurrency(totals.my_total_settlements_in)}
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Activity analytics (monthly + category) =====
type ActivityAnalyticsCardProps = {
  period: UserActivityPeriod;
  totals: UserActivityTotals;
  monthly: UserActivityMonthly[];
  categories: UserActivityCategoryBreakdown[];
};

const monthlyChartConfig = {
  expense_share: { label: 'Your share', color: 'hsl(var(--chart-1))' },
  settlements_out: { label: 'You paid', color: 'hsl(var(--chart-2))' },
  settlements_in: { label: 'You received', color: 'hsl(var(--chart-3))' },
};

const categoryChartConfig = {
  amount: { label: 'Amount', color: 'hsl(var(--chart-1))' },
};

function ActivityAnalyticsCard({
  period,
  totals,
  monthly,
  categories,
}: ActivityAnalyticsCardProps) {
  const hasMonthlyActivity = monthly.some(
    (m) =>
      m.my_expense_share > 0 ||
      m.my_settlements_out > 0 ||
      m.my_settlements_in > 0,
  );

  const monthlyData = monthly.map((m) => ({
    month: formatMonthLabel(m.month),
    expense_share: m.my_expense_share,
    settlements_out: m.my_settlements_out,
    settlements_in: m.my_settlements_in,
  }));

  const categoryData = categories.map((c) => ({
    category: c.category ?? 'Uncategorized',
    amount: c.total_amount,
  }));

  return (
    <Card className='shadow-sm'>
      <CardHeader>
        <CardTitle>Your activity over time</CardTitle>
        <Typography variant='b3' className='text-muted-foreground'>
          A quick view of how much you spend, pay, and receive across months.
        </Typography>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Tiny summary */}
        <div className='rounded-lg border px-3 py-3'>
          <Typography variant='c1' className='text-muted-foreground'>
            This period
          </Typography>
          <Typography variant='b3' className='mt-1'>
            You contributed{' '}
            <span className='text-foreground font-semibold'>
              {numberToCurrency(totals.my_total_expense_share)}
            </span>{' '}
            in expenses, paid{' '}
            <span className='text-foreground font-semibold'>
              {numberToCurrency(totals.my_total_settlements_out)}
            </span>{' '}
            to others, and received{' '}
            <span className='text-foreground font-semibold'>
              {numberToCurrency(totals.my_total_settlements_in)}
            </span>{' '}
            back.
          </Typography>
        </div>

        {/* Charts */}
        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Typography
              variant='c1'
              className='text-muted-foreground'
            >
              Monthly activity
            </Typography>
            {!hasMonthlyActivity ? (
              <Typography variant='b3' className='mt-2 text-muted-foreground'>
                No recorded expenses or settlements in this period yet.
              </Typography>
            ) : (
              <ChartContainer
                config={monthlyChartConfig}
                className='h-52 w-full rounded-xl border bg-card/80 px-2 py-2'
              >
                <AreaChart data={monthlyData}>
                  <CartesianGrid vertical={false} strokeDasharray='3 3' />
                  <XAxis
                    dataKey='month'
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `${Math.round(value / 1000)}k`
                        : `${value}`
                    }
                  />
                  <ChartTooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={<ChartTooltipContent />}
                  />
                  <Area
                    type='monotone'
                    dataKey='expense_share'
                    strokeWidth={2}
                    fill='#E0EAFF'
                    stroke='#4F46E5'
                    name='Your share'
                  />
                  <Area
                    type='monotone'
                    dataKey='settlements_out'
                    strokeWidth={2}
                    fill='#FDE68A'
                    stroke='#F59E0B'
                    name='You paid'
                  />
                  <Area
                    type='monotone'
                    dataKey='settlements_in'
                    strokeWidth={2}
                    fill='#BBF7D0'
                    stroke='#22C55E'
                    name='You received'
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </div>

          <div className='space-y-2'>
            <Typography
              variant='c1'
              className='text-muted-foreground'
            >
              Spending by category
            </Typography>
            {categoryData.length === 0 ? (
              <Typography variant='b3' className='mt-2 text-muted-foreground'>
                No spending by category recorded in this period.
              </Typography>
            ) : (
              <ChartContainer
                config={categoryChartConfig}
                className='h-52 w-full rounded-xl border bg-card/80 px-3 py-3'
              >
                <BarChart data={categoryData}>
                  <CartesianGrid vertical={false} strokeDasharray='3 3' />
                  <XAxis
                    dataKey='category'
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      value >= 1000
                        ? `${Math.round(value / 1000)}k`
                        : `${value}`
                    }
                  />
                  <ChartTooltip
                    cursor={{ fill: 'transparent' }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey='amount' radius={6} name='Amount'>
                    {categoryData.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={getCategoryColor(entry.category)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== Recent activity (expenses + settlements lists) =====
type RecentActivityCardProps = {
  expenses: UserActivityExpenseItem[];
  settlements: UserActivitySettlementItem[];
};

function RecentActivityCard({
  expenses,
  settlements,
}: RecentActivityCardProps) {
  const latestExpenses = expenses.slice(0, 5);
  const latestSettlements = settlements.slice(0, 5);

  const hasAny = latestExpenses.length > 0 || latestSettlements.length > 0;

  return (
    <Card className='shadow-sm'>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <Typography variant='b3' className='text-muted-foreground'>
          The latest expenses and settlements involving you.
        </Typography>
      </CardHeader>
      <CardContent className='space-y-5'>
        {!hasAny && (
          <Typography variant='b3' className='text-muted-foreground'>
            No recent activity yet. Add an expense in one of your groups to get
            started.
          </Typography>
        )}

        {latestExpenses.length > 0 && (
          <div className='space-y-2'>
            <Typography
              variant='c1'
              className='text-muted-foreground'
            >
              Expenses involving you
            </Typography>
            <div className='space-y-2'>
              {latestExpenses.map((e) => {
                const dateLabel = formatDate(new Date(e.date), 'd MMM yyyy');
                return (
                  <Link
                    key={e.id}
                    href={`/groups/${e.group_id}/expenses/${e.id}`}
                    className='group bg-background hover:bg-accent/50 flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3 py-2 transition-colors'
                  >
                    <div className='flex min-w-0 flex-1 flex-col'>
                      <Typography variant='b3' className='font-medium'>
                        {e.description}
                      </Typography>
                      <Typography
                        variant='c2'
                        className='text-xs text-muted-foreground'
                      >
                        {e.group_name} • {e.category ?? 'Uncategorized'} •{' '}
                        {dateLabel}
                      </Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <div className='text-right'>
                        <Typography
                          variant='b3'
                          className='font-semibold text-primary-800 dark:text-primary-100'
                        >
                          {numberToCurrency(e.my_share_amount)}
                        </Typography>
                        <Typography
                          variant='c2'
                          className='text-xs text-muted-foreground'
                        >
                          Your share
                        </Typography>
                      </div>
                      <ChevronRight
                        aria-hidden
                        className='text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5'
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {latestSettlements.length > 0 && (
          <div className='space-y-2'>
            <Typography
              variant='c1'
              className='text-muted-foreground'
            >
              Settlements involving you
            </Typography>
            <div className='space-y-2'>
              {latestSettlements.map((s) => {
                const dateLabel = formatDate(new Date(s.date), 'd MMM yyyy');
                const isIncoming = s.direction === 'incoming';

                return (
                  <Link
                    key={s.id}
                    href={`/groups/${s.group_id}`}
                    className={cn(
                      'group flex flex-wrap items-start justify-between gap-2 rounded-lg border px-3 py-2 transition hover:brightness-95',
                      isIncoming ? 'bg-credit-soft' : 'bg-owed-soft',
                    )}
                  >
                    <div className='flex min-w-0 flex-1 flex-col'>
                      <Typography variant='b3' className='font-medium'>
                        {isIncoming
                          ? `${s.from_user_name} paid you`
                          : `You paid ${s.to_user_name}`}
                      </Typography>
                      <Typography
                        variant='c2'
                        className='text-xs text-muted-foreground'
                      >
                        {s.group_name} • {dateLabel}
                      </Typography>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='text-right'>
                        <Typography
                          variant='b3'
                          className={cn(
                            'font-semibold',
                            isIncoming ? 'text-credit' : 'text-owed',
                          )}
                        >
                          {numberToCurrency(s.amount)}
                        </Typography>
                        <Typography
                          variant='c2'
                          className='text-xs text-muted-foreground'
                        >
                          {isIncoming ? 'You received' : 'You paid'}
                        </Typography>
                      </div>
                      <ChevronRight
                        aria-hidden
                        className='text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5'
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== Top groups card =====
type TopGroupsCardProps = {
  topGroups: UserActivityTopGroup[];
};

function TopGroupsCard({ topGroups }: TopGroupsCardProps) {
  if (!topGroups.length) {
    return (
      <Card className='shadow-sm'>
        <CardHeader>
          <CardTitle>Your most active groups</CardTitle>
        </CardHeader>
        <CardContent>
          <Typography variant='b3' className='text-muted-foreground'>
            You do not have any activity across groups yet.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const visible = topGroups.slice(0, 5);

  return (
    <Card className='shadow-sm'>
      <CardHeader>
        <CardTitle>Your most active groups</CardTitle>
        <Typography variant='b3' className='text-muted-foreground'>
          Based on your expense share and settlements.
        </Typography>
      </CardHeader>
      <CardContent className='space-y-2'>
        {visible.map((g, idx) => {
          const rank = idx + 1;

          const rowClass =
            rank === 1
              ? 'bg-primary-50/90 border-primary-200/90 dark:bg-primary-950/35 dark:border-primary-900/70'
              : 'bg-card border-border/80';

          return (
            <Link
              key={g.group_id}
              href={`/groups/${g.group_id}`}
              className={cn(
                'group flex items-center justify-between rounded-xl border px-3 py-2 shadow-sm transition hover:brightness-95',
                rowClass,
              )}
            >
              <div className='flex items-center gap-3'>
                <span className='flex h-8 w-8 items-center justify-center rounded-full bg-primary-600/90 text-xs font-semibold text-primary-50 dark:bg-primary-400 dark:text-primary-950'>
                  {rank}
                </span>
                <div className='flex flex-col'>
                  <Typography variant='b3' className='font-medium'>
                    {g.group_name}
                  </Typography>
                  <span className='text-muted-foreground text-[11px] leading-3'>
                    {g.expenses_count} expenses • {g.settlements_count}{' '}
                    settlements
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <div className='text-right'>
                  <Typography
                    variant='b3'
                    className='text-foreground font-semibold'
                  >
                    {numberToCurrency(g.total_expense_share)}
                  </Typography>
                  <Typography
                    variant='c2'
                    className='text-muted-foreground text-[11px]'
                  >
                    Your share in this group
                  </Typography>
                </div>
                <ChevronRight
                  aria-hidden
                  className='text-muted-foreground h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5'
                />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ===== Quick stats card =====
type QuickStatsCardProps = {
  totals: UserActivityTotals;
};

function QuickStatsCard({ totals }: QuickStatsCardProps) {
  const net = totals.my_net_position;

  return (
    <Card className='shadow-sm'>
      <CardHeader>
        <CardTitle>Quick stats</CardTitle>
        <Typography variant='b3' className='text-muted-foreground'>
          A small snapshot of where you stand.
        </Typography>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='rounded-lg border bg-primary-50/80 px-3 py-3 dark:bg-primary-950/25'>
            <Typography
              variant='c1'
              className='text-primary-800 dark:text-primary-100'
            >
              Overall position
            </Typography>
            <Typography variant='s2' className='mt-1 font-semibold'>
              {numberToCurrency(net)}
            </Typography>
          </div>

          <div className='rounded-lg border px-3 py-3'>
            <Typography variant='c1' className='text-muted-foreground'>
              Total flow
            </Typography>
            <Typography variant='s2' className='mt-1 font-semibold'>
              {numberToCurrency(
                totals.my_total_expense_share +
                  totals.my_total_settlements_out +
                  totals.my_total_settlements_in,
              )}
            </Typography>
          </div>
        </div>

        <div className='bg-primary-50/80 dark:bg-primary-950/25 rounded-xl border p-3'>
          <div className='flex items-center gap-2'>
            <span className='bg-primary-600 text-primary-50 dark:bg-primary-500 dark:text-primary-950 flex h-7 w-7 items-center justify-center rounded-full'>
              <UsersIcon className='h-3.5 w-3.5' />
            </span>
            <Typography variant='c1' className='text-foreground'>
              Tip
            </Typography>
          </div>
          <Typography variant='b3' className='text-muted-foreground mt-2'>
            Use group settlements regularly so your overall position does not
            drift too far in either direction.
          </Typography>
        </div>

        <ButtonLink
          href='/groups'
          className='w-full text-sm'
          variant='secondary'
        >
          Go to my groups
        </ButtonLink>
      </CardContent>
    </Card>
  );
}
