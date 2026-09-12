'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronRight, Plus,ReceiptText, User2 } from 'lucide-react';
import * as React from 'react';

import api from '@/lib/api';
import { numberToCurrency } from '@/lib/helper';

import { Button } from '@/components/button';
import { ButtonLink } from '@/components/button-link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { Typography } from '@/components/typography';

import type { PaginatedApiResponse } from '@/types/api';
import type { GroupDetail } from '@/types/entities/group';

type ExpenseListItem = {
  id: string;
  group_id: string;
  created_by_id: string;
  description: string;
  amount: number;
  category: string | null;
  date: string; // ISO
  paid_by_id: string;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: {
    id: string;
    name: string;
    email: string;
  };
  paid_by: {
    id: string;
    name: string;
    email: string;
  };
};

type ExpensesTabProps = {
  group: GroupDetail;
  groupId: string;
  isOwner: boolean;
  currentUserId?: string;
};

export function ExpensesTab({
  group,
  groupId,
  isOwner,
  currentUserId,
}: ExpensesTabProps) {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['group-expenses', groupId],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await api.get<PaginatedApiResponse<ExpenseListItem>>(
        `/groups/${groupId}/expenses`,
        {
          params: {
            page: pageParam,
            per_page: 10,
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
  const allExpenses: ExpenseListItem[] = pages.flatMap((p) => p.data);
  const firstMeta = pages[0]?.meta;

  const totalAmount = allExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCount = firstMeta?.count ?? allExpenses.length;

  const mostRecentDate =
    allExpenses.length > 0
      ? new Date(
          [...allExpenses].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )[0].date,
        )
      : null;

  const showEmptyState =
    !isLoading && !isError && allExpenses && allExpenses.length === 0;

  return (
    <div className='grid gap-4 lg:grid-cols-[2fr,1.1fr]'>
      {/* Summary card */}
      <Card className='shadow-sm'>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <Typography variant='b3' className='text-muted-foreground'>
            A quick snapshot of what has been spent in this group.
          </Typography>
        </CardHeader>

        <CardContent className='space-y-3 text-sm'>
          <div className='rounded-lg border bg-primary-50/80 px-3 py-2 dark:bg-primary-950/25'>
            <Typography
              variant='c2'
              className='text-primary-800 dark:text-primary-100'
            >
              Total amount
            </Typography>
            <Typography variant='s2' className='mt-1 font-semibold'>
              {numberToCurrency(totalAmount)}
            </Typography>
            {totalCount > 0 && (
              <Typography
                variant='c2'
                className='mt-0.5 text-xs text-primary-900/80 dark:text-primary-100/80'
              >
                Across {totalCount} expense
                {totalCount > 1 ? 's' : ''}
              </Typography>
            )}
          </div>

          <div className='rounded-lg border px-3 py-2'>
            <Typography variant='c2' className='text-muted-foreground'>
              Number of expenses loaded
            </Typography>
            <Typography variant='s2' className='mt-1 font-semibold'>
              {allExpenses.length}
              {firstMeta && firstMeta.max_page > 1 && (
                <span className='text-muted-foreground ml-1 text-xs font-normal'>
                  (page {firstMeta.page} of {firstMeta.max_page})
                </span>
              )}
            </Typography>
          </div>

          <div className='rounded-lg border px-3 py-2'>
            <Typography variant='c2' className='text-muted-foreground'>
              Most recent
            </Typography>
            <Typography variant='b3' className='mt-1'>
              {mostRecentDate
                ? format(mostRecentDate, 'd MMMM yyyy')
                : 'No expenses yet'}
            </Typography>
          </div>
        </CardContent>
      </Card>

      {/* List of expenses */}
      <Card className='shadow-sm'>
        <CardHeader className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle>Expenses</CardTitle>
            <Typography variant='b3' className='text-muted-foreground'>
              All expenses recorded in this group.
            </Typography>
          </div>

          {group.is_locked || group.is_archived ? null : (
            <ButtonLink
              href={`/groups/${group.id}/expenses/form`}
              size='sm'
              variant='primary'
              rightIcon={Plus}
            >
              Add Expense
            </ButtonLink>
          )}
        </CardHeader>

        <CardContent>
          {isLoading && !data && (
            <div className='py-6'>
              <Typography variant='c1' className='text-muted-foreground'>
                Loading expenses…
              </Typography>
            </div>
          )}

          {isError && !isLoading && (
            <div className='py-6'>
              <Typography variant='c1' className='text-destructive'>
                Could not load expenses. Please try again later.
              </Typography>
            </div>
          )}

          {showEmptyState && (
            <div className='py-6'>
              <Typography variant='c1' className='text-muted-foreground'>
                No expenses added yet. Start by creating the first one.
              </Typography>
            </div>
          )}

          {!showEmptyState && allExpenses.length > 0 && (
            <>
              <div className='space-y-3'>
                {allExpenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    currentUserId={currentUserId}
                    isOwner={isOwner}
                    groupId={groupId}
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

type ExpenseRowProps = {
  expense: ExpenseListItem;
  groupId: string;
  isOwner: boolean;
  currentUserId?: string;
};

function ExpenseRow({
  expense,
  groupId,
  isOwner,
  currentUserId,
}: ExpenseRowProps) {
  const paidByYou = expense.paid_by_id === currentUserId;
  const createdByYou = expense.created_by_id === currentUserId;

  const showOwnerBadge =
    isOwner && expense.paid_by_id === expense.created_by_id;

  const hasReceipt = Boolean(expense.receipt_url);

  return (
    <div className='flex items-center justify-between gap-3 rounded-xl border bg-card/70 px-3 py-2 shadow-sm hover:bg-primary-50/40 dark:hover:bg-primary-950/30'>
      <div className='flex items-start gap-3'>
        {/* Icon bubble */}
        <div className='mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-100'>
          <ReceiptText className='h-4 w-4' />
        </div>

        <div className='flex flex-col'>
          <div className='flex items-center gap-2'>
            <Typography variant='b3' className='font-semibold'>
              {expense.description}
            </Typography>

            {expense.category && (
              <span className='bg-secondary text-secondary-foreground inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium'>
                {expense.category}
              </span>
            )}
          </div>

          <Typography variant='c2' className='mt-0.5 text-muted-foreground'>
            Paid by{' '}
            <span className='font-medium text-foreground'>
              {paidByYou ? 'You' : expense.paid_by.name}
            </span>{' '}
            on {format(new Date(expense.date), 'd MMM yyyy, HH:mm')}
          </Typography>

          <div className='mt-1 flex flex-wrap items-center gap-2 text-[11px]'>
            <span className='bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium'>
              <User2 className='h-3 w-3' />
              {createdByYou
                ? 'Added by you'
                : `Added by ${expense.created_by.name}`}
            </span>

            {showOwnerBadge && (
              <span className='bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium'>
                Owner entry
              </span>
            )}

            {hasReceipt && (
              <span className='bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium'>
                Receipt attached
              </span>
            )}
          </div>
        </div>
      </div>

      <div className='flex flex-col items-end gap-1'>
        <Typography
          variant='b3'
          className='font-semibold text-primary-900 dark:text-primary-50'
        >
          {numberToCurrency(expense.amount)}
        </Typography>

        <div className='flex items-center gap-1'>
          <ButtonLink
            href={`/groups/${groupId}/expenses/${expense.id}`}
            variant='ghost'
            size='sm'
            className='px-2 py-1 text-[11px]'
            rightIcon={ChevronRight}
          >
            View details
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
