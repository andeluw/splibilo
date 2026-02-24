import { useQuery } from '@tanstack/react-query';
import { format as formatDate,subDays } from 'date-fns';
import { Link2Icon, UsersIcon } from 'lucide-react';
import React from 'react';
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
import { copyToClipboardWithToast, numberToCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/chart';
import { Typography } from '@/components/typography';

import type { ApiResponse } from '@/types/api';
import type { GroupAnalytics, GroupDetail } from '@/types/entities/group';

type OverviewTabProps = {
  group: GroupDetail;
  groupId: string;
};

type RangePreset = '7d' | '30d';

export function OverviewTab({ group, groupId }: OverviewTabProps) {
  const today = React.useMemo(() => new Date(), []);

  const [rangePreset, setRangePreset] = React.useState<RangePreset>('7d');

  const { rangeFrom, rangeTo } = React.useMemo(() => {
    if (rangePreset === '7d') {
      const to = formatDate(today, 'yyyy-MM-dd');
      const from = formatDate(subDays(today, 6), 'yyyy-MM-dd');
      return { rangeFrom: from, rangeTo: to };
    }

    // 30 days (inclusive)
    const to = formatDate(today, 'yyyy-MM-dd');
    const from = formatDate(subDays(today, 29), 'yyyy-MM-dd');
    return { rangeFrom: from, rangeTo: to };
  }, [rangePreset, today]);

  const {
    data: analytics,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['group-analytics', groupId, rangePreset, rangeFrom, rangeTo],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GroupAnalytics>>(
        `/groups/${groupId}/analytics`,
        {
          params: {
            from: rangeFrom,
            to: rangeTo,
          },
        },
      );
      return res.data.data;
    },
    enabled: !!groupId,
  });

  const net = group.me_balance?.net ?? 0;
  const totalShouldPay = group.me_balance?.total_should_pay ?? 0;
  const totalShouldReceive = group.me_balance?.total_should_receive ?? 0;

  const analyticsTotals = analytics?.totals;
  const byCategory = analytics?.by_category ?? [];
  const byDate = analytics?.by_date ?? [];
  const topPayers = analytics?.top_payers ?? [];

  const hasActivityInRange = byDate.some(
    (d) => d.total_expenses > 0 || d.total_settlements > 0,
  );

  const activityChartData = byDate.map((d) => ({
    date: formatDate(new Date(d.date), 'd MMM'),
    expenses: d.total_expenses,
    settlements: d.total_settlements,
  }));

  const categoryChartData = byCategory.map((c) => ({
    category: c.category || 'Uncategorized',
    amount: c.total_amount,
  }));

  const apiRangeFrom = analytics?.range?.from ?? rangeFrom;
  const apiRangeTo = analytics?.range?.to ?? rangeTo;

  const handleCopyInviteLink = React.useCallback(() => {
    if (!group.invite_code || typeof window === 'undefined') return;

    const inviteUrl = `${group.invite_code}`;

    copyToClipboardWithToast(inviteUrl, {
      successMessage: 'Invite code copied. Share it with your friends!',
      errorMessage: 'Could not copy invite code',
    });
  }, [group.invite_code]);

  return (
    <div className='grid gap-4 lg:grid-cols-[2fr,1.4fr]'>
      <GroupBalanceCard
        net={net}
        totalShouldPay={totalShouldPay}
        totalShouldReceive={totalShouldReceive}
      />

      <div className='flex flex-col gap-4'>
        <GroupAnalyticsCard
          rangePreset={rangePreset}
          onRangeChange={setRangePreset}
          apiRangeFrom={apiRangeFrom}
          apiRangeTo={apiRangeTo}
          isLoading={isLoading}
          isError={isError}
          analyticsTotals={analyticsTotals}
          hasActivityInRange={hasActivityInRange}
          activityChartData={activityChartData}
          categoryChartData={categoryChartData}
          topPayers={topPayers}
        />

        <GroupInfoCard group={group} onCopyInviteLink={handleCopyInviteLink} />
      </div>
    </div>
  );
}

//#region //*=========== Group Balance Card ===========
type GroupBalanceCardProps = {
  net: number;
  totalShouldPay: number;
  totalShouldReceive: number;
};

function GroupBalanceCard({
  net,
  totalShouldPay,
  totalShouldReceive,
}: GroupBalanceCardProps) {
  const balanceState = net < 0 ? 'debt' : net > 0 ? 'credit' : 'settled';

  const label =
    net < 0
      ? `You owe ${numberToCurrency(Math.abs(net))}`
      : net > 0
        ? `You are owed ${numberToCurrency(net)}`
        : 'All settled';

  const subLabel =
    net < 0
      ? 'This is the total amount you still owe in this group.'
      : net > 0
        ? 'This is the total amount your friends still owe you in this group.'
        : 'Everyone is settled up for now.';

  return (
    <Card
      className={cn(
        'shadow-sm',
        balanceState === 'credit' &&
          'border-emerald-300/70 bg-emerald-50/70 dark:border-emerald-500/40 dark:bg-emerald-950/25',
        balanceState === 'debt' &&
          'border-red-300/70 bg-red-50/70 dark:border-red-500/40 dark:bg-red-950/25',
        balanceState === 'settled' &&
          'border-primary-100/70 bg-primary-50/50 dark:border-primary-900/40 dark:bg-primary-950/20',
      )}
    >
      <CardHeader>
        <CardTitle>Your balance in this group</CardTitle>
      </CardHeader>
      <CardContent>
        <Typography
          variant='s1'
          className={cn(
            'font-semibold',
            balanceState === 'debt' && 'text-red-600 dark:text-red-400',
            balanceState === 'credit' &&
              'text-emerald-600 dark:text-emerald-400',
            balanceState === 'settled' &&
              'text-primary-700 dark:text-primary-200',
          )}
        >
          {label}
        </Typography>
        <Typography variant='b3' className='mt-1 text-muted-foreground'>
          {subLabel}
        </Typography>

        <div className='mt-4 grid gap-3 sm:grid-cols-2'>
          <div className='rounded-lg border bg-background px-4 py-3'>
            <Typography
              variant='c1'
              className='uppercase tracking-wide text-muted-foreground'
            >
              Total you should pay
            </Typography>
            <Typography variant='s2' className='mt-1 font-semibold'>
              {numberToCurrency(totalShouldPay)}
            </Typography>
          </div>
          <div className='rounded-lg border bg-background px-4 py-3'>
            <Typography
              variant='c1'
              className='uppercase tracking-wide text-muted-foreground'
            >
              Total you should receive
            </Typography>
            <Typography variant='s2' className='mt-1 font-semibold'>
              {numberToCurrency(totalShouldReceive)}
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
//#endregion  //*======== Group Balance Card ===========

//#region //*=========== Group Analytics Card ===========
type GroupAnalyticsCardProps = {
  rangePreset: RangePreset;
  onRangeChange: (preset: RangePreset) => void;
  apiRangeFrom: string;
  apiRangeTo: string;
  isLoading: boolean;
  isError: boolean;
  analyticsTotals?: GroupAnalytics['totals'];
  hasActivityInRange: boolean;
  activityChartData: { date: string; expenses: number; settlements: number }[];
  categoryChartData: { category: string; amount: number }[];
  topPayers: GroupAnalytics['top_payers'];
};

function GroupAnalyticsCard({
  rangePreset,
  onRangeChange,
  apiRangeFrom,
  apiRangeTo,
  isLoading,
  isError,
  analyticsTotals,
  hasActivityInRange,
  activityChartData,
  categoryChartData,
  topPayers,
}: GroupAnalyticsCardProps) {
  return (
    <Card className='shadow-sm'>
      <CardHeader className='space-y-2'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <CardTitle>Group activity</CardTitle>
            <Typography variant='b3' className='text-muted-foreground'>
              From {formatDate(new Date(apiRangeFrom), 'd MMMM yyyy')} to{' '}
              {formatDate(new Date(apiRangeTo), 'd MMMM yyyy')}
            </Typography>
          </div>

          {/* Range selector */}
          <div className='inline-flex items-center rounded-full border bg-muted/60 p-1 text-xs'>
            <Button
              type='button'
              size='sm'
              variant={rangePreset === '7d' ? 'primary' : 'ghostblack'}
              className={cn('h-7 rounded-full px-3 text-xs')}
              onClick={() => onRangeChange('7d')}
            >
              Last 7 days
            </Button>
            <Button
              type='button'
              size='sm'
              variant={rangePreset === '30d' ? 'primary' : 'ghostblack'}
              className={cn('h-7 rounded-full px-3 text-xs')}
              onClick={() => onRangeChange('30d')}
            >
              Last 30 days
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {isLoading && (
          <Typography variant='b3' className='text-muted-foreground'>
            Loading analytics…
          </Typography>
        )}

        {isError && !isLoading && (
          <Typography variant='b3' className='text-destructive'>
            Could not load analytics. Please try again later.
          </Typography>
        )}

        {!isLoading && !isError && analyticsTotals && (
          <>
            <MetricsTiles totals={analyticsTotals} />

            <YourActivitySummary totals={analyticsTotals} />

            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Typography
                  variant='c1'
                  className='uppercase tracking-wide text-muted-foreground'
                >
                  Expenses vs settlements
                </Typography>
                <ActivityAreaChart
                  hasActivity={hasActivityInRange}
                  data={activityChartData}
                />
              </div>

              <div className='space-y-2'>
                <Typography
                  variant='c1'
                  className='uppercase tracking-wide text-muted-foreground'
                >
                  Spending by category
                </Typography>
                {categoryChartData.length === 0 ? (
                  <Typography
                    variant='b3'
                    className='mt-2 text-muted-foreground'
                  >
                    No spending by category in this period yet.
                  </Typography>
                ) : (
                  <CategoryChart categoryChartData={categoryChartData} />
                )}
              </div>
            </div>

            {topPayers.length > 0 && <TopPayersList topPayers={topPayers} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}

type MetricsTilesProps = {
  totals: GroupAnalytics['totals'];
};

function MetricsTiles({ totals }: MetricsTilesProps) {
  return (
    <div className='grid gap-3 sm:grid-cols-3'>
      <div className='rounded-lg border bg-primary-50/80 px-3 py-3 dark:bg-primary-950/25'>
        <Typography
          variant='c1'
          className='uppercase tracking-wide text-primary-800 dark:text-primary-100'
        >
          Total expenses
        </Typography>
        <Typography variant='s2' className='mt-1 font-semibold'>
          {numberToCurrency(totals.group_total_expenses)}
        </Typography>
      </div>

      <div className='rounded-lg border bg-emerald-50/80 px-3 py-3 dark:bg-emerald-950/25'>
        <Typography
          variant='c1'
          className='uppercase tracking-wide text-emerald-700 dark:text-emerald-300'
        >
          Settled
        </Typography>
        <Typography variant='s2' className='mt-1 font-semibold'>
          {numberToCurrency(totals.group_total_settlements)}
        </Typography>
      </div>

      <div className='rounded-lg border bg-red-50/80 px-3 py-3 dark:bg-red-950/25'>
        <Typography
          variant='c1'
          className='uppercase tracking-wide text-red-700 dark:text-red-300'
        >
          Still outstanding
        </Typography>
        <Typography variant='s2' className='mt-1 font-semibold'>
          {numberToCurrency(totals.group_net_outstanding)}
        </Typography>
      </div>
    </div>
  );
}
//#endregion  //*======== Group Analytics Card ===========

//#region //*=========== Your Activity Summary ===========
type YourActivitySummaryProps = {
  totals: GroupAnalytics['totals'];
};

function YourActivitySummary({ totals }: YourActivitySummaryProps) {
  return (
    <div className='rounded-lg border bg-amber-50/80 px-3 py-3 dark:bg-amber-950/25'>
      <Typography
        variant='c1'
        className='uppercase tracking-wide text-amber-800'
      >
        Your activity
      </Typography>
      <Typography variant='b3' className='mt-1'>
        You created{' '}
        <span className='font-semibold text-red-700'>
          {numberToCurrency(totals.me_total_expenses_created)}
        </span>{' '}
        in expenses and recorded{' '}
        <span className='font-semibold text-emerald-700 '>
          {numberToCurrency(totals.me_total_settlements_made)}
        </span>{' '}
        in settlements during this period.
      </Typography>
    </div>
  );
}
//#endregion  //*======== Your Activity Summary ===========

//#region //*=========== Activity Chart ===========
const activityChartConfig = {
  expenses: {
    label: 'Expenses',
    color: 'hsl(var(--chart-1))',
  },
  settlements: {
    label: 'Settlements',
    color: 'hsl(var(--chart-2))',
  },
};

type ActivityAreaChartProps = {
  hasActivity: boolean;
  data: { date: string; expenses: number; settlements: number }[];
};

function ActivityAreaChart({ hasActivity, data }: ActivityAreaChartProps) {
  if (!hasActivity) {
    return (
      <Typography variant='b3' className='mt-2 text-muted-foreground'>
        No expenses or settlements recorded in this period.
      </Typography>
    );
  }

  return (
    <ChartContainer
      config={activityChartConfig}
      className='h-52 w-full rounded-xl border bg-card/80 px-2 py-2'
    >
      <AreaChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray='3 3' />
        <XAxis
          dataKey='date'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) =>
            value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`
          }
        />
        <ChartTooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={<ChartTooltipContent />}
        />
        <Area
          type='monotone'
          dataKey='expenses'
          strokeWidth={2}
          fill='#FED7AA'
          stroke='#F97316'
          name='Expenses'
        />
        <Area
          type='monotone'
          dataKey='settlements'
          strokeWidth={2}
          fill='#BBF7D0'
          stroke='#22C55E'
          name='Settlements'
        />
      </AreaChart>
    </ChartContainer>
  );
}
//#endregion  //*======== Activity Chart ===========

//#region //*=========== Category Chart ===========
export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    Transport: '#F97316', // orange
    Activities: '#0EA5E9', // sky blue
    Accommodation: '#8B5CF6', // violet
    Food: '#EC4899', // pink
    Entertainment: '#F43F5E', // red
    Shopping: '#14B8A6', // teal
    Others: '#A3A3A3', // gray
  };

  return map[category] ?? '#A3A3A3';
}

const categoryChartConfig = {
  amount: {
    label: 'Amount',
    color: 'hsl(var(--chart-1))',
  },
};

function CategoryChart({
  categoryChartData,
}: {
  categoryChartData: { category: string; amount: number }[];
}) {
  return (
    <ChartContainer
      config={categoryChartConfig}
      className='h-52 w-full rounded-xl border bg-card/80 px-3 py-3'
    >
      <BarChart data={categoryChartData}>
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
            value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`
          }
        />
        <ChartTooltip
          cursor={{ fill: 'transparent' }}
          content={<ChartTooltipContent />}
        />
        <Bar dataKey='amount' radius={6} name='Amount'>
          {categoryChartData.map((entry) => (
            <Cell
              key={entry.category}
              fill={getCategoryColor(entry.category)}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
//#endregion  //*======== Category Chart ===========

//#region //*=========== Top Payers List ===========
type TopPayersListProps = {
  topPayers: GroupAnalytics['top_payers'];
};

function TopPayersList({ topPayers }: TopPayersListProps) {
  if (!topPayers.length) return null;

  const visiblePayers = topPayers.slice(0, 5);

  return (
    <div className='pt-3 border-t'>
      <Typography
        variant='c1'
        className='uppercase tracking-wide text-muted-foreground'
      >
        Top payers
      </Typography>

      <div className='mt-2 space-y-1.5'>
        {visiblePayers.map((p, index) => {
          const rank = index + 1;

          const rowClass =
            rank === 1
              ? 'bg-amber-50/90 border-amber-200/90 dark:bg-amber-950/35 dark:border-amber-900/70'
              : rank === 2
                ? 'bg-slate-50/90 border-slate-200/90 dark:bg-slate-900/60 dark:border-slate-700'
                : rank === 3
                  ? 'bg-orange-50/90 border-orange-200/90 dark:bg-orange-950/35 dark:border-orange-900/70'
                  : rank === 4
                    ? 'bg-primary-50/70 border-primary-100/80 dark:bg-primary-950/30 dark:border-primary-900/60'
                    : 'bg-card border-border/80';

          const pillClass =
            rank === 1
              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-amber-50'
              : rank === 2
                ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-900'
                : rank === 3
                  ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-orange-50'
                  : 'bg-primary-600/90 text-primary-50 dark:bg-primary-500 dark:text-primary-950';

          const subtitle =
            rank === 1 ? '#1 this period' : `#${rank} this period`;

          return (
            <div
              key={p.user_id}
              className={cn(
                'flex items-center justify-between rounded-xl border px-3 py-2 shadow-sm transition-colors',
                rowClass,
              )}
            >
              <div className='flex items-center gap-3'>
                {/* Rank pill */}
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
                    pillClass,
                  )}
                >
                  {rank}
                </span>

                <div className='flex flex-col'>
                  <Typography variant='b3' className='font-medium'>
                    {p.name}
                  </Typography>
                  <span className='text-[11px] leading-3 text-slate-600 dark:text-slate-300'>
                    {subtitle}
                  </span>
                </div>
              </div>

              <Typography
                variant='b3'
                className='font-semibold text-slate-900 dark:text-slate-50'
              >
                {numberToCurrency(p.total_paid)}
              </Typography>
            </div>
          );
        })}
      </div>
    </div>
  );
}
//#endregion  //*======== Top Payers List ===========

//#region //*=========== Group Info Card ===========

type GroupInfoCardProps = {
  group: GroupDetail;
  onCopyInviteLink: () => void;
};

function GroupInfoCard({ group, onCopyInviteLink }: GroupInfoCardProps) {
  const hasInvite = Boolean(group.invite_code);

  return (
    <Card className='shadow-sm'>
      <CardHeader className='pb-3'>
        <CardTitle>Group info</CardTitle>
        {group.name && (
          <Typography variant='b3' className='text-muted-foreground'>
            A quick snapshot of this group.
          </Typography>
        )}
      </CardHeader>

      <CardContent className='space-y-3'>
        {/* Invite section */}
        <div className='rounded-xl border border-primary-100/80 bg-gradient-to-r from-primary-50/95 via-primary-50/85 to-primary-100/80 p-3 dark:border-primary-900/70 dark:from-primary-950/60 dark:via-primary-950/50 dark:to-primary-900/50'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <span className='flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-primary-50 dark:bg-primary-400 dark:text-primary-950'>
                <Link2Icon className='h-3.5 w-3.5' />
              </span>
              <Typography
                variant='c1'
                className='uppercase tracking-wide text-primary-900 dark:text-primary-50'
              >
                Invite code
              </Typography>
            </div>
          </div>

          <div className='mt-2 flex flex-wrap items-center gap-2'>
            <span className='inline-flex items-center gap-2 rounded-md border border-primary-200/80 bg-card/80 px-2.5 py-1 text-sm font-semibold text-primary-900 dark:border-primary-800 dark:bg-primary-950/70 dark:text-primary-50'>
              {hasInvite ? group.invite_code : 'Not available'}
            </span>

            {hasInvite && (
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-8 px-3'
                onClick={onCopyInviteLink}
              >
                Copy invite code
              </Button>
            )}
          </div>
        </div>

        {/* Members section */}
        <div className='rounded-xl border border-blue-200/80 bg-blue-50/85 p-3 dark:border-blue-900/70 dark:bg-blue-950/45'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-2'>
              <span className='flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-blue-50 dark:bg-blue-400 dark:text-blue-950'>
                <UsersIcon className='h-3.5 w-3.5' />
              </span>
              <Typography
                variant='c1'
                className='uppercase tracking-wide text-blue-900 dark:text-blue-50'
              >
                Members
              </Typography>
            </div>
          </div>

          <div className='mt-2 flex items-baseline justify-between gap-2'>
            <Typography
              variant='s2'
              className='font-semibold text-blue-900 dark:text-blue-50'
            >
              {group.group_members.length} people
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
//#endregion  //*======== Group Info Card ===========
