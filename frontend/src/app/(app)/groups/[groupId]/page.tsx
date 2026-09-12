'use client';

import { useQuery } from '@tanstack/react-query';
import { Crown, Link2Icon, Users2 } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import * as React from 'react';

import api from '@/lib/api';
import { copyToClipboardWithToast } from '@/lib/helper';

import { Button } from '@/components/button';
import { Card, CardContent } from '@/components/card';
import withAuth from '@/components/hoc/withAuth';
import UserLayout from '@/components/layout/user/user-layout';
import { NextImage } from '@/components/next-image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/tabs';
import { Typography } from '@/components/typography';

import useAuthStore from '@/store/useAuthStore';

import { BalancesTab } from '@/app/(app)/groups/[groupId]/containers/BalancesTab';
import { ExpensesTab } from '@/app/(app)/groups/[groupId]/containers/ExpensesTab';
import { MembersTab } from '@/app/(app)/groups/[groupId]/containers/MembersTab';
import { OverviewTab } from '@/app/(app)/groups/[groupId]/containers/OverviewTab';
import { SettingsTab } from '@/app/(app)/groups/[groupId]/containers/SettingsTab';
import { SettlementsTab } from '@/app/(app)/groups/[groupId]/containers/SettlementsTab';

import type { ApiResponse } from '@/types/api';
import type { GroupDetail } from '@/types/entities/group';

type GroupTab =
  | 'overview'
  | 'expenses'
  | 'balances'
  | 'settlements'
  | 'members'
  | 'settings';

function GroupDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const groupId = params?.groupId as string;
  const user = useAuthStore.useUser();

  // Read ?tab= from URL and validate it
  const tabParam = (searchParams?.get('tab') ?? '') as GroupTab;
  const validTabs: GroupTab[] = [
    'overview',
    'expenses',
    'balances',
    'settlements',
    'members',
    'settings',
  ];

  const initialTab: GroupTab = validTabs.includes(tabParam)
    ? tabParam
    : 'overview';

  const {
    data: group,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['group-detail', groupId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GroupDetail>>(`/groups/${groupId}`);
      return res.data.data;
    },
    enabled: !!groupId,
  });

  const currentMember = React.useMemo(() => {
    if (!group || !user) return null;
    return group.group_members.find((m) => m.user_id === user.id) ?? null;
  }, [group, user]);

  const isOwner = currentMember?.role === 'OWNER';
  const currentUserId = user?.id;

  return (
    <UserLayout backHref='/groups'>
      <div className='flex flex-col gap-8'>
        {/* Loading state */}
        {isLoading && (
          <Card>
            <CardContent className='py-10'>
              <Typography variant='c1' className='text-muted-foreground'>
                Loading group details…
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Error state */}
        {isError && (
          <Card>
            <CardContent className='py-10'>
              <Typography variant='c1' className='text-destructive'>
                Failed to load group. Please try again later.
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Loaded state */}
        {group && (
          <>
            {/* Header */}
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-start gap-5'>
                <div className='mt-1 h-11 w-11 overflow-hidden rounded-xl border border-primary-100 bg-primary-50 text-primary-800 dark:border-primary-900/60 dark:bg-primary-950/40 dark:text-primary-100'>
                  {group.icon_url ? (
                    <NextImage
                      src={group.icon_url}
                      alt={group.name}
                      width={44}
                      height={44}
                      className='h-full w-full object-cover'
                    />
                  ) : (
                    <div className='flex h-full w-full flex-col items-center justify-center text-[11px] font-semibold leading-tight'>
                      <Users2 className='mb-0.5 h-3.5 w-3.5 opacity-80' />
                    </div>
                  )}
                </div>

                <div>
                  <div className='flex items-center gap-2'>
                    <Typography
                      as='h1'
                      variant='h1'
                      className='text-primary-800 dark:text-primary-200'
                    >
                      {group.name}
                    </Typography>

                    {isOwner && (
                      <span className='border-primary-200 bg-primary-100 text-primary-800 dark:border-primary-900/50 dark:bg-primary-900/50 dark:text-primary-100 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium'>
                        <Crown className='h-3 w-3' />
                        Owner
                      </span>
                    )}
                  </div>

                  {group.description && (
                    <Typography
                      variant='b3'
                      className='mt-1 max-w-xl text-muted-foreground'
                    >
                      {group.description}
                    </Typography>
                  )}

                  <div className='mt-2 flex flex-wrap items-center gap-2 text-xs'>
                    {group.category && (
                      <span className='inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[11px] font-medium text-primary-800 dark:border-primary-900/40 dark:bg-primary-950/40 dark:text-primary-100'>
                        {group.category}
                      </span>
                    )}
                    {group.is_archived && (
                      <span className='bg-muted text-muted-foreground inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium'>
                        Archived
                      </span>
                    )}
                    {group.is_locked && (
                      <span className='bg-muted text-muted-foreground inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium'>
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Invite + members */}
              <div className='flex flex-col items-start gap-2 sm:items-end'>
                <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                  <Users2 className='h-3.5 w-3.5' aria-hidden />
                  {group.group_members.length} members
                </div>
                {group.invite_code && (
                  <div className='flex items-center gap-2'>
                    <span className='figure bg-muted rounded-md border px-2.5 py-1 text-sm font-semibold tracking-wide'>
                      {group.invite_code}
                    </span>
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='h-8 px-2'
                      leftIcon={Link2Icon}
                      onClick={() =>
                        group.invite_code &&
                        copyToClipboardWithToast(group.invite_code, {
                          successMessage:
                            'Invite code copied. Share it with your friends!',
                          errorMessage: 'Could not copy invite code',
                        })
                      }
                    >
                      Copy
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue={initialTab} className='w-full'>
              <TabsList>
                <TabsTrigger value='overview'>Overview</TabsTrigger>
                <TabsTrigger value='expenses'>Expenses</TabsTrigger>
                <TabsTrigger value='balances'>Balances</TabsTrigger>
                <TabsTrigger value='settlements'>Settlements</TabsTrigger>
                <TabsTrigger value='members'>Members</TabsTrigger>
                <TabsTrigger value='settings'>Settings</TabsTrigger>
              </TabsList>

              <TabsContent value='overview' className='mt-4 space-y-4'>
                <OverviewTab group={group} groupId={groupId} />
              </TabsContent>

              <TabsContent value='expenses' className='mt-4 space-y-4'>
                <ExpensesTab
                  group={group}
                  groupId={groupId}
                  isOwner={!!isOwner}
                  currentUserId={currentUserId}
                />
              </TabsContent>

              <TabsContent value='balances' className='mt-4 space-y-4'>
                <BalancesTab group={group} groupId={groupId} />
              </TabsContent>

              <TabsContent value='settlements' className='mt-4 space-y-4'>
                <SettlementsTab
                  group={group}
                  groupId={groupId}
                  currentUserId={currentUserId}
                />
              </TabsContent>

              <TabsContent value='members' className='mt-4 space-y-4'>
                <MembersTab
                  group={group}
                  isOwner={!!isOwner}
                  currentUserId={currentUserId}
                  groupId={groupId}
                />
              </TabsContent>

              <TabsContent value='settings' className='mt-4 space-y-4'>
                <SettingsTab
                  group={group}
                  isOwner={!!isOwner}
                  groupId={groupId}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </UserLayout>
  );
}

export default withAuth(GroupDetailPage, 'user');
