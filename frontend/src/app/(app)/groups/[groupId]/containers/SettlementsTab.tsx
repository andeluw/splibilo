'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowDownRight,
  ArrowRightLeft,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  FileText,
} from 'lucide-react';
import * as React from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Download from 'yet-another-react-lightbox/plugins/download';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import 'yet-another-react-lightbox/styles.css';

import api from '@/lib/api';
import { numberToCurrency } from '@/lib/helper';

import { Button } from '@/components/button';
import { ButtonLink } from '@/components/button-link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { Typography } from '@/components/typography';

import type { GroupDetail } from '@/types/entities/group';

type SettlementListItem = {
  id: string;
  group_id: string;
  from_user_id: string;
  to_user_id: string;
  amount: number;
  notes: string | null;
  proof_url: string | null;
  date: string; // ISO
  from_user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
  to_user: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
};

type SettlementsResponse = {
  code: number;
  message: string;
  data: SettlementListItem[];
  meta: {
    page: number;
    per_page: number;
    max_page: number;
    count: number;
  };
};

type SettlementsTabProps = {
  group: GroupDetail;
  groupId: string;
  currentUserId?: string;
};

type ViewFilter = 'all' | 'me';

export function SettlementsTab({
  group,
  groupId,
  currentUserId,
}: SettlementsTabProps) {
  const [viewFilter, setViewFilter] = React.useState<ViewFilter>('all');

  const memberIdParam =
    viewFilter === 'me' && currentUserId ? currentUserId : undefined;

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['group-settlements', groupId, memberIdParam],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get<SettlementsResponse>(
        `/groups/${groupId}/settlements`,
        {
          params: {
            page: pageParam,
            per_page: 10,
            sort_dir: 'desc',
            ...(memberIdParam ? { member_id: memberIdParam } : {}),
          },
        },
      );
      return res.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta.page < lastPage.meta.max_page) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!groupId,
  });

  const pages = data?.pages ?? [];
  const allSettlements: SettlementListItem[] = pages.flatMap((p) => p.data);
  const firstMeta = pages[0]?.meta;

  const totalAmountSettled = allSettlements.reduce(
    (sum, s) => sum + s.amount,
    0,
  );
  const totalCount = firstMeta?.count ?? allSettlements.length;

  const mostRecentDate =
    allSettlements.length > 0
      ? new Date(
          [...allSettlements].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )[0].date,
        )
      : null;

  const totalPaidByMe =
    currentUserId != null
      ? allSettlements
          .filter((s) => s.from_user_id === currentUserId)
          .reduce((sum, s) => sum + s.amount, 0)
      : 0;

  const totalReceivedByMe =
    currentUserId != null
      ? allSettlements
          .filter((s) => s.to_user_id === currentUserId)
          .reduce((sum, s) => sum + s.amount, 0)
      : 0;

  const showEmptyState =
    !isLoading && !isError && allSettlements && allSettlements.length === 0;

  return (
    <div className='grid gap-4 lg:grid-cols-[2fr,1.1fr]'>
      {/* Summary card */}
      <Card className='shadow-sm'>
        <CardHeader>
          <CardTitle>Settlement summary</CardTitle>
          <Typography variant='b3' className='text-muted-foreground'>
            See how much has actually been paid back in this group.
          </Typography>
          {currentUserId && (
            <Typography
              variant='c2'
              className='mt-1 text-xs text-muted-foreground'
            >
              {viewFilter === 'me'
                ? 'Showing settlements that involve you.'
                : 'Showing all settlements in this group.'}
            </Typography>
          )}
        </CardHeader>

        <CardContent className='space-y-3 text-sm'>
          {/* Total settled */}
          <div className='rounded-lg border px-3 py-2'>
            <Typography variant='c2' className='text-muted-foreground'>
              Total settled
            </Typography>
            <Typography variant='s2' className='mt-1 font-semibold'>
              {numberToCurrency(totalAmountSettled)}
            </Typography>
            {totalCount > 0 && (
              <Typography variant='c2' className='text-muted-foreground mt-0.5 text-xs'>
                Across {totalCount} settlement
                {totalCount > 1 ? 's' : ''}
              </Typography>
            )}
          </div>

          {/* Your movement */}
          <div className='rounded-lg border px-3 py-2'>
            <Typography variant='c2' className='text-muted-foreground'>
              Your movement
            </Typography>
            <div className='mt-1 space-y-0.5'>
              <Typography variant='b3' className='flex items-center gap-1'>
                <ArrowUpRight className='text-owed h-3 w-3' />
                <span className='text-muted-foreground'>You paid</span>
                <span className='font-semibold text-foreground'>
                  {numberToCurrency(totalPaidByMe)}
                </span>
              </Typography>
              <Typography variant='b3' className='flex items-center gap-1'>
                <ArrowDownRight className='text-credit h-3 w-3' />
                <span className='text-muted-foreground'>You received</span>
                <span className='font-semibold text-foreground'>
                  {numberToCurrency(totalReceivedByMe)}
                </span>
              </Typography>
            </div>
          </div>

          {/* Most recent */}
          <div className='rounded-lg border px-3 py-2'>
            <Typography variant='c2' className='text-muted-foreground'>
              Most recent settlement
            </Typography>
            <Typography variant='b3' className='mt-1'>
              {mostRecentDate
                ? format(mostRecentDate, 'd MMMM yyyy')
                : 'No settlements yet'}
            </Typography>
          </div>
        </CardContent>
      </Card>

      {/* List of settlements */}
      <Card className='shadow-sm'>
        <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle>Settlements</CardTitle>
            <Typography variant='b3' className='text-muted-foreground'>
              Transfers recorded to settle up balances.
            </Typography>
          </div>

          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
            {currentUserId && (
              <div className='inline-flex items-center rounded-full border border-primary-100/80 bg-card/80 p-1 text-xs dark:border-primary-900/60 dark:bg-primary-950/40'>
                <Button
                  type='button'
                  size='sm'
                  variant={viewFilter === 'all' ? 'primary' : 'ghostblack'}
                  className='h-7 rounded-full px-3 text-xs'
                  onClick={() => setViewFilter('all')}
                >
                  All members
                </Button>
                <Button
                  type='button'
                  size='sm'
                  variant={viewFilter === 'me' ? 'primary' : 'ghostblack'}
                  className='h-7 rounded-full px-3 text-xs'
                  onClick={() => setViewFilter('me')}
                >
                  Only you
                </Button>
              </div>
            )}

            {group.is_locked || group.is_archived ? null : (
              <ButtonLink
                href={`/groups/${group.id}/settlements/form`}
                size='sm'
                variant='secondary'
                rightIcon={ArrowRightLeft}
              >
                Record settlement
              </ButtonLink>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading && !data && (
            <div className='py-6'>
              <Typography variant='c1' className='text-muted-foreground'>
                Loading settlements…
              </Typography>
            </div>
          )}

          {isError && !isLoading && (
            <div className='py-6'>
              <Typography variant='c1' className='text-destructive'>
                Could not load settlements. Please try again later.
              </Typography>
            </div>
          )}

          {showEmptyState && (
            <div className='py-6'>
              <Typography variant='c1' className='text-muted-foreground'>
                {viewFilter === 'me'
                  ? 'No settlements involving you yet.'
                  : 'No settlements recorded yet. Start by adding the first one.'}
              </Typography>
            </div>
          )}

          {!showEmptyState && allSettlements.length > 0 && (
            <>
              <div className='space-y-3'>
                {allSettlements.map((settlement) => (
                  <SettlementRow
                    key={settlement.id}
                    settlement={settlement}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>

              {hasNextPage && (
                <div className='mt-4 flex justify-center'>
                  <Button
                    variant='outlineblack'
                    size='sm'
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? 'Loading more…' : 'Load more'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type SettlementRowProps = {
  settlement: SettlementListItem;
  currentUserId?: string;
};

function SettlementRow({ settlement, currentUserId }: SettlementRowProps) {
  const { from_user, to_user, from_user_id, to_user_id, amount, notes, date } =
    settlement;

  const youAreSender = currentUserId && from_user_id === currentUserId;
  const youAreReceiver = currentUserId && to_user_id === currentUserId;

  const fromLabel = youAreSender ? 'You' : from_user.name;
  const toLabel = youAreReceiver ? 'you' : to_user.name;

  const isIncomingForYou = Boolean(youAreReceiver && !youAreSender);
  const isOutgoingForYou = Boolean(youAreSender && !youAreReceiver);

  const rowColorClass = isIncomingForYou
    ? 'bg-credit-soft border'
    : isOutgoingForYou
      ? 'bg-owed-soft border'
      : 'border-primary-100/80 bg-card/80 dark:border-primary-900/50';

  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 shadow-sm transition-colors hover:bg-primary-50/40 dark:hover:bg-primary-950/30 ${rowColorClass}`}
    >
      <div className='flex flex-col gap-1'>
        <div className='flex flex-wrap items-center gap-1 text-sm'>
          <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100'>
            <ArrowRightLeft className='h-3.5 w-3.5' />
          </span>

          <Typography variant='b3' className='font-semibold'>
            {fromLabel} paid {toLabel}
          </Typography>
        </div>

        <Typography variant='c2' className='text-muted-foreground'>
          on {format(new Date(date), 'd MMM yyyy, HH:mm')}
        </Typography>

        <div className='mt-1 flex flex-wrap items-center gap-2 text-[11px]'>
          {notes && (
            <span className='bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium'>
              <FileText className='h-3 w-3' />
              {notes}
            </span>
          )}

          {settlement.proof_url && (
            <span className='bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium'>
              <CheckCircle2 className='h-3 w-3' />
              Proof attached
            </span>
          )}

          {isIncomingForYou && (
            <span className='bg-credit-soft text-credit inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium'>
              <ArrowDownRight className='h-3 w-3' />
              Incoming
            </span>
          )}

          {isOutgoingForYou && (
            <span className='bg-owed-soft text-owed inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium'>
              <ArrowUpRight className='h-3 w-3' />
              Outgoing
            </span>
          )}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <Typography
          variant='b3'
          className='font-semibold text-primary-900 dark:text-primary-50'
        >
          {numberToCurrency(amount)}
        </Typography>

        {settlement.proof_url && (
          <>
            <Button
              type='button'
              size='icon'
              variant='ghostblack'
              className='h-8 w-8'
              onClick={() => setIsLightboxOpen(true)}
              aria-label='View proof of transfer'
            >
              <Eye className='h-4 w-4' />
            </Button>

            <Lightbox
              open={isLightboxOpen}
              close={() => setIsLightboxOpen(false)}
              slides={[{ src: settlement.proof_url }]}
              index={0}
              on={{ view: () => {} }}
              plugins={[Download, Zoom]}
            />
          </>
        )}
      </div>
    </div>
  );
}
