import { useQuery } from '@tanstack/react-query';
import { format as formatDate,subDays } from 'date-fns';
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
import { getCategoryColor } from '@/lib/category-color';
import { numberToCurrency } from '@/lib/helper';
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

  return (
    <div className='grid gap-4 lg:grid-cols-[2fr,1.4fr]'>
      <GroupBalanceCard
        net={net}
        totalShouldPay={totalShouldPay}
        totalShouldReceive={totalShouldReceive}
      />

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
        balanceState === 'credit' && 'bg-credit-soft border',
        balanceState === 'debt' && 'bg-owed-soft border',
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
            'tabular font-semibold',
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

        <div className='mt-4 grid gap-3 sm:grid-cols-2'>
          <div className='rounded-lg border bg-background px-4 py-3'>
            <Typography
              variant='c1'
              className='text-muted-foreground'
            >
              Total you should pay
            </Typography>
            <Typography variant='s2' className='tabular mt-1 font-semibold'>
              {numberToCurrency(totalShouldPay)}
            </Typography>
          </div>
          <div className='rounded-lg border bg-background px-4 py-3'>
            <Typography
              variant='c1'
              className='text-muted-foreground'
            >
              Total you should receive
            </Typography>
            <Typography variant='s2' className='tabular mt-1 font-semibold'>
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
                  className='text-muted-foreground'
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
                  className='text-muted-foreground'
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
          className='text-primary-800 dark:text-primary-100'
        >
          Total expenses
        </Typography>
        <Typography variant='s2' className='mt-1 font-semibold'>
          {numberToCurrency(totals.group_total_expenses)}
        </Typography>
      </div>

      <div className='bg-credit-soft rounded-lg border px-3 py-3'>
        <Typography variant='c1' className='text-credit'>
          Settled
        </Typography>
        <Typography variant='s2' className='mt-1 font-semibold'>
          {numberToCurrency(totals.group_total_settlements)}
        </Typography>
      </div>

      <div className='bg-owed-soft rounded-lg border px-3 py-3'>
        <Typography variant='c1' className='text-owed'>
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
    <div className='rounded-lg border px-3 py-3'>
      <Typography variant='c1' className='text-muted-foreground'>
        Your activity
      </Typography>
      <Typography variant='b3' className='mt-1'>
        You created{' '}
        <span className='text-foreground font-semibold'>
          {numberToCurrency(totals.me_total_expenses_created)}
        </span>{' '}
        in expenses and recorded{' '}
        <span className='text-foreground font-semibold'>
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
  // Bars are relative to the top payer, so the leader always fills the row.
  const maxPaid = Number(visiblePayers[0]?.total_paid ?? 0);

  return (
    <div className='pt-3 border-t'>
      <Typography variant='c1' className='text-muted-foreground'>
        Top payers
      </Typography>

      <div className='mt-3 space-y-1'>
        {visiblePayers.map((p, index) => {
          const rank = index + 1;
          const pct =
            maxPaid > 0
              ? Math.max(6, Math.round((Number(p.total_paid) / maxPaid) * 100))
              : 0;

          return (
            <div
              key={p.user_id}
              className='relative overflow-hidden rounded-lg px-3 py-2'
            >
              <div
                aria-hidden
                className='absolute inset-y-0 left-0 bg-primary-100/70 dark:bg-primary-900/40'
                style={{ width: `${pct}%` }}
              />
              <div className='relative flex items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-2.5'>
                  <span className='figure w-4 shrink-0 text-sm font-semibold text-primary-600 dark:text-primary-300'>
                    {rank}
                  </span>
                  <Typography variant='b3' className='truncate font-medium'>
                    {p.name}
                  </Typography>
                </div>
                <Typography variant='b3' className='figure shrink-0 font-semibold'>
                  {numberToCurrency(p.total_paid)}
                </Typography>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
//#endregion  //*======== Top Payers List ===========
