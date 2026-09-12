'use client';

import { CrownIcon, UsersIcon } from 'lucide-react';

import { useDialog } from '@/hooks/useDialog';

import { Button } from '@/components/button';
import { Card, CardContent,CardHeader, CardTitle } from '@/components/card';
import { Typography } from '@/components/typography';

import { useRemoveMemberMutation } from '@/app/(app)/groups/[groupId]/hooks/mutation';
import { InviteMemberModal } from '@/app/(app)/groups/[groupId]/modal/InviteMemberModal';

import type { GroupDetail } from '@/types/entities/group';

type MembersTabProps = {
  group: GroupDetail;
  isOwner: boolean;
  currentUserId?: string;
  groupId: string;
};

export function MembersTab({
  group,
  isOwner,
  currentUserId,
  groupId,
}: MembersTabProps) {
  const members = group.group_members;

  const { mutate: removeMember, isPending: isRemovingMember } =
    useRemoveMemberMutation(groupId);

  const dialog = useDialog();

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!groupId || !isOwner) return;

    dialog({
      title: 'Remove member',
      description: `Are you sure you want to remove ${memberName} from this group? This action cannot be undone.`,
      submitText: 'Remove member',
      variant: 'danger',
      withIcon: true,
      catchOnCancel: true,
    })
      .then(() => {
        removeMember({ memberId });
      })
      .catch(() => {
        // cancelled, ignore
      });
  };

  return (
    <Card className='shadow-sm'>
      <CardHeader>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle>Members ({members.length})</CardTitle>
            <Typography variant='b3' className='text-muted-foreground'>
              List of all group members.
            </Typography>
          </div>

          {isOwner && (
            <InviteMemberModal groupId={group.id}>
              {({ openModal }) => (
                <Button size='sm' onClick={openModal}>
                  Invite by email
                </Button>
              )}
            </InviteMemberModal>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className='space-y-2'>
          {members.map((m) => {
            const isSelf = m.user_id === currentUserId;
            const canRemove = isOwner && !isSelf && m.role !== 'OWNER';

            return (
              <div
                key={m.id}
                className='flex items-center justify-between rounded-lg border bg-card/70 px-3 py-2 shadow-xs'
              >
                <div className='flex flex-col'>
                  <div className='flex items-center gap-2'>
                    <Typography variant='s2' className='font-medium'>
                      {m.user.name}
                    </Typography>
                    {isSelf && (
                      <span className='rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-800 dark:bg-primary-950/50 dark:text-primary-100'>
                        You
                      </span>
                    )}
                  </div>
                  <Typography variant='c2' className='text-muted-foreground'>
                    {m.user.email}
                  </Typography>
                </div>

                <div className='flex items-center gap-2'>
                  <RoleChip role={m.role} />

                  {canRemove && (
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() =>
                        handleRemoveMember(m.id, m.user.name ?? 'this member')
                      }
                      disabled={isRemovingMember}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

type RoleChipProps = {
  role: string;
};

function RoleChip({ role }: RoleChipProps) {
  const isOwner = role === 'OWNER';

  if (isOwner) {
    return (
      <span className='bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-100 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium'>
        <span className='bg-primary-600 text-primary-50 dark:bg-primary-500 dark:text-primary-950 flex h-4 w-4 items-center justify-center rounded-full text-[10px]'>
          <CrownIcon className='h-3 w-3' />
        </span>
        OWNER
      </span>
    );
  }

  return (
    <span className='bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium'>
      <span className='bg-primary-100 text-primary-700 dark:bg-primary-900/60 dark:text-primary-200 flex h-4 w-4 items-center justify-center rounded-full text-[10px]'>
        <UsersIcon className='h-3 w-3' />
      </span>
      MEMBER
    </span>
  );
}
