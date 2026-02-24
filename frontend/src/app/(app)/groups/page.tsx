'use client';

import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import api from '@/lib/api';
import { numberToCurrency } from '@/lib/helper';
import { cn } from '@/lib/utils';

import { Button } from '@/components/button';
import { ButtonLink } from '@/components/button-link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { Checkbox } from '@/components/checkbox';
import withAuth from '@/components/hoc/withAuth';
import { Input } from '@/components/input';
import UserLayout from '@/components/layout/user/user-layout';
import { Select } from '@/components/select';
import { Typography } from '@/components/typography';

import { JoinGroupModal } from '@/app/(app)/groups/modal/JoinGroupModal';
import { GROUP_CATEGORY_OPTIONS } from '@/constant/options/group';

import type { ApiResponse } from '@/types/api';
import type { Group } from '@/types/entities/group';

type FilterFormValues = {
  search: string;
  category: string;
  show_archived: boolean;
};

export default withAuth(GroupsPage, 'user');
function GroupsPage() {
  const methods = useForm<FilterFormValues>({
    defaultValues: {
      search: '',
      category: '',
      show_archived: false,
    },
  });

  const { watch, reset } = methods;

  const search = watch('search');
  const category = watch('category');
  const showArchived = watch('show_archived');

  const hasFilters = Boolean(search || category || showArchived);

  const {
    data: groupsData,
    isLoading: isLoadingGroupList,
    isError: isErrorGroupList,
  } = useQuery({
    queryKey: ['groups', { search, category, showArchived }],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Group[]>>('/groups', {
        params: {
          disable_pagination: true,
          search: search || undefined,
          category: category || undefined,
          is_archived: showArchived ? 'true' : 'false',
        },
      });
      return res.data.data;
    },
  });

  const groups = groupsData ?? [];

  return (
    <UserLayout>
      <div className='flex flex-col gap-6'>
        {/* Header */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <Typography variant='h1' className='font-bold text-primary-800'>
              Your groups
            </Typography>
            <Typography
              variant='b3'
              className='mt-1 max-w-xl text-muted-foreground'
            >
              See all your shared expense groups. Create a new one or join with
              an invite code from a friend.
            </Typography>
          </div>

          <div className='flex gap-2'>
            <JoinGroupModal>
              {({ openModal }) => (
                <Button variant='outlineblack' onClick={openModal}>
                  Join with code
                </Button>
              )}
            </JoinGroupModal>
            <ButtonLink href='/groups/form'>Create group</ButtonLink>
          </div>
        </div>

        <FormProvider {...methods}>
          <Card>
            <CardHeader>
              <CardTitle>Filter Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex flex-1 flex-col gap-3 sm:flex-row sm:items-center mb-4'>
                <div className='flex-1'>
                  <Input
                    id='search'
                    label='Search'
                    placeholder='Search groups by name...'
                    leftIcon={Search}
                  />
                </div>

                <div className='flex-1'>
                  <Select
                    id='category'
                    label='Category'
                    options={GROUP_CATEGORY_OPTIONS}
                    placeholder='All categories'
                  />
                </div>
              </div>
              <Checkbox
                name='show_archived'
                label='Show archived groups'
                size='base'
              />
            </CardContent>
          </Card>
        </FormProvider>

        {/* Loading skeleton */}
        {isLoadingGroupList && (
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className='h-28 animate-pulse rounded-xl border bg-muted/40'
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {isErrorGroupList && !isLoadingGroupList && (
          <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3'>
            <Typography variant='c1' className='text-destructive'>
              Could not load groups. Please try again in a moment.
            </Typography>
          </div>
        )}

        {/* Empty state – truly no groups at all, no filters applied */}
        {!isLoadingGroupList &&
          !isErrorGroupList &&
          groups.length === 0 &&
          !hasFilters && (
            <div className='flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-10 text-center'>
              <Typography variant='s1' className='font-semibold'>
                You don't have any groups yet
              </Typography>
              <Typography
                variant='c1'
                className='mt-2 max-w-sm text-muted-foreground'
              >
                Create a group for your trip, household, or friends. You can
                invite others once it is set up.
              </Typography>
              {/* No extra buttons here – header already has Create / Join */}
            </div>
          )}

        {/* Filtered empty state – filters/search applied but no match */}
        {!isLoadingGroupList &&
          !isErrorGroupList &&
          groups.length === 0 &&
          hasFilters && (
            <div className='rounded-xl border bg-card px-6 py-8'>
              <Typography variant='s1' className='font-semibold'>
                No groups match your current filters
              </Typography>
              <Typography
                variant='c1'
                className='mt-2 max-w-md text-muted-foreground'
              >
                Try adjusting your search, change the category, or hide archived
                groups.
              </Typography>
              <div className='mt-4'>
                <Button
                  variant='outlineblack'
                  size='sm'
                  onClick={() =>
                    reset({
                      search: '',
                      category: '',
                      show_archived: false,
                    })
                  }
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}

        {/* List */}
        {!isLoadingGroupList && !isErrorGroupList && groups.length > 0 && (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}

function GroupCard({ group }: { group: Group }) {
  const balance = group.user_net_balance ?? 0;

  const balanceLabel =
    balance < 0
      ? `You owe ${numberToCurrency(Math.abs(balance))}`
      : balance > 0
        ? `You are owed ${numberToCurrency(balance)}`
        : 'All settled';

  const balanceState =
    balance < 0 ? 'debt' : balance > 0 ? 'credit' : 'settled';

  const categoryLabel = group.category || 'Uncategorized';

  return (
    <Link href={`/groups/${group.id}`} className='block'>
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md',
          balanceState === 'credit' &&
            'border-emerald-300/70 bg-emerald-50/40 dark:border-emerald-500/40 dark:bg-emerald-950/20',
          balanceState === 'debt' &&
            'border-red-300/70 bg-red-50/40 dark:border-red-500/40 dark:bg-red-950/20',
        )}
      >
        {/* Accent strip */}
        <span
          className={cn(
            'absolute inset-y-0 left-0 w-1',
            balanceState === 'credit' && 'bg-emerald-400',
            balanceState === 'debt' && 'bg-red-400',
            balanceState === 'settled' && 'bg-muted',
          )}
        />

        <div className='flex items-start justify-between gap-3'>
          <div className='min-w-0'>
            <Typography variant='s1' className='truncate font-semibold'>
              {group.name}
            </Typography>

            {group.description ? (
              <Typography
                variant='c1'
                className='mt-1 line-clamp-2 text-muted-foreground'
              >
                {group.description}
              </Typography>
            ) : (
              <Typography
                variant='c1'
                className='mt-1 text-muted-foreground/80'
              >
                No description yet
              </Typography>
            )}

            <div className='mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground'>
              <span className='rounded-full bg-muted px-2 py-0.5'>
                {categoryLabel}
              </span>
              {group.is_archived && (
                <span className='rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'>
                  Archived
                </span>
              )}
            </div>
          </div>

          {group.members_count !== undefined && (
            <div className='shrink-0 rounded-full bg-primary-50 px-3 py-1 text-right text-[11px] font-medium text-primary-800 dark:bg-primary-900/20 dark:text-primary-200'>
              <span className='block leading-none'>
                {group.members_count} members
              </span>
            </div>
          )}
        </div>

        <div className='mt-3 flex flex-wrap items-center justify-between gap-2'>
          <Typography
            variant='c1'
            className={cn(
              'text-sm font-medium',
              balanceState === 'debt' && 'text-red-600 dark:text-red-400',
              balanceState === 'credit' &&
                'text-emerald-600 dark:text-emerald-400',
              balanceState === 'settled' && 'text-muted-foreground',
            )}
          >
            {balanceLabel}
          </Typography>

          <Typography variant='c1' className='text-xs text-muted-foreground/80'>
            Tap to view details
          </Typography>
        </div>
      </div>
    </Link>
  );
}
