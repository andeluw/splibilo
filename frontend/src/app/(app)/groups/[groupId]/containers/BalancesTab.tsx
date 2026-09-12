import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import api from '@/lib/api';
import { numberToCurrency } from '@/lib/helper';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { Typography } from '@/components/typography';

import type { ApiResponse } from '@/types/api';
import type {
  BalanceDebt,
  GroupBalances,
  GroupDetail,
  GroupMember,
} from '@/types/entities/group';

type BalancesTabProps = {
  group: GroupDetail;
  groupId: string;
};

export function BalancesTab({ group, groupId }: BalancesTabProps) {
  const {
    data: balances,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['group-balances', groupId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GroupBalances>>(
        `/groups/${groupId}/balances`,
      );
      return res.data.data;
    },
    enabled: !!groupId,
  });

  const memberMap = React.useMemo(() => {
    const map = new Map<string, GroupMember['user']>();
    group.group_members.forEach((gm) => {
      map.set(gm.user_id, gm.user);
    });
    return map;
  }, [group]);

  if (isLoading) {
    return (
      <Card className='shadow-sm'>
        <CardContent className='py-8'>
          <Typography variant='c1' className='text-muted-foreground'>
            Loading balances…
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className='shadow-sm'>
        <CardContent className='py-8'>
          <Typography variant='c1' className='text-destructive'>
            Failed to load balances. Please try again.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!balances) {
    return (
      <Card className='shadow-sm'>
        <CardContent className='py-8'>
          <Typography variant='c1' className='text-muted-foreground'>
            No balances available yet.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const { debts, me } = balances;

  return (
    <div className='grid gap-4 lg:grid-cols-[2fr,1.2fr]'>
      {/* All balances card */}
      <Card className='shadow-sm'>
        <CardHeader className='space-y-1'>
          <CardTitle>All balances</CardTitle>
          <Typography variant='b3' className='text-muted-foreground'>
            Who owes whom after all expenses are split.
          </Typography>
        </CardHeader>

        <CardContent>
          {debts.length === 0 ? (
            <div className='bg-credit-soft rounded-lg border px-3 py-3'>
              <Typography variant='c1' className='text-credit'>
                Everyone is settled up.
              </Typography>
              <Typography variant='c2' className='text-credit/80 mt-1'>
                No one owes anyone in this group right now.
              </Typography>
            </div>
          ) : (
            <div className='space-y-2'>
              {debts.map((d) => (
                <DebtRow
                  key={`${d.from_user_id}-${d.to_user_id}`}
                  debt={d}
                  memberMap={memberMap}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your position card */}
      <Card className='shadow-sm'>
        <CardHeader className='space-y-1'>
          <CardTitle>Your position</CardTitle>
          <Typography variant='b3' className='text-muted-foreground'>
            A summary of what you owe and what others owe you.
          </Typography>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* You should pay */}
          <div className='bg-owed-soft rounded-lg border px-3 py-3'>
            <Typography variant='c1' className='text-owed'>
              You should pay
            </Typography>

            {me.should_pay.length === 0 ? (
              <Typography variant='c2' className='text-owed/80 mt-1'>
                You don&apos;t owe anyone in this group.
              </Typography>
            ) : (
              <div className='mt-2 space-y-2'>
                {me.should_pay.map((d) => (
                  <DebtRow
                    key={`pay-${d.from_user_id}-${d.to_user_id}`}
                    debt={d}
                    memberMap={memberMap}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          {/* You should receive */}
          <div className='bg-credit-soft rounded-lg border px-3 py-3'>
            <Typography variant='c1' className='text-credit'>
              You should receive
            </Typography>

            {me.should_receive.length === 0 ? (
              <Typography variant='c2' className='text-credit/80 mt-1'>
                No one owes you at the moment.
              </Typography>
            ) : (
              <div className='mt-2 space-y-2'>
                {me.should_receive.map((d) => (
                  <DebtRow
                    key={`recv-${d.from_user_id}-${d.to_user_id}`}
                    debt={d}
                    memberMap={memberMap}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type DebtRowProps = {
  debt: BalanceDebt;
  memberMap: Map<string, GroupMember['user']>;
  compact?: boolean;
};

function DebtRow({ debt, memberMap, compact }: DebtRowProps) {
  const fromUser = memberMap.get(debt.from_user_id);
  const toUser = memberMap.get(debt.to_user_id);

  const fromName = fromUser?.name ?? 'Someone';
  const toName = toUser?.name ?? 'someone';

  return (
    <div className='flex items-center justify-between rounded-xl border bg-card/70 px-3 py-2 text-sm'>
      <div className='flex flex-col'>
        <Typography variant='b3'>
          <span className='font-medium'>{fromName}</span>{' '}
          <span className='text-muted-foreground'>owes</span>{' '}
          <span className='font-medium'>{toName}</span>
        </Typography>
        {!compact && (
          <Typography variant='c2' className='mt-0.5 text-muted-foreground'>
            Pending split from shared expenses.
          </Typography>
        )}
      </div>

      <span className='inline-flex items-center rounded-full bg-primary-800 px-2.5 py-0.5 text-xs font-semibold text-primary-50 dark:bg-primary-400 dark:text-primary-950'>
        {numberToCurrency(debt.amount)}
      </span>
    </div>
  );
}
