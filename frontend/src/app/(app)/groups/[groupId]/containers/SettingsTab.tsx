import { useDialog } from '@/hooks/useDialog';

import { Button } from '@/components/button';
import { ButtonLink } from '@/components/button-link';
import { Card, CardContent,CardHeader, CardTitle } from '@/components/card';
import { Typography } from '@/components/typography';

import {
  useArchiveGroupMutation,
  useLeaveGroupMutation,
  useUnarchiveGroupMutation,
} from '@/app/(app)/groups/[groupId]/hooks/mutation';

import type { GroupDetail } from '@/types/entities/group';

type SettingsTabProps = {
  group: GroupDetail;
  isOwner: boolean;
  groupId: string;
};

export function SettingsTab({ group, isOwner, groupId }: SettingsTabProps) {
  const { mutate: archiveGroup, isPending: isArchiving } =
    useArchiveGroupMutation(groupId);
  const { mutate: unarchiveGroup, isPending: isUnarchiving } =
    useUnarchiveGroupMutation(groupId);

  const { mutate: leaveGroup, isPending: isLeavingGroup } =
    useLeaveGroupMutation(groupId);

  const dialog = useDialog();

  const handleArchiveGroup = () => {
    if (!groupId || !isOwner) return;

    const isCurrentlyArchived = group.is_archived;

    dialog({
      title: isCurrentlyArchived ? 'Unarchive group' : 'Archive group',
      description: isCurrentlyArchived
        ? 'This group will become active again and can be used for new expenses.'
        : 'This will hide the group from active lists. You can still bring it back later.',
      submitText: isCurrentlyArchived ? 'Unarchive' : 'Archive group',
      variant: 'danger',
      withIcon: true,
      catchOnCancel: true,
    })
      .then(() => {
        isCurrentlyArchived ? unarchiveGroup() : archiveGroup();
      })
      .catch(() => {
        // cancelled
      });
  };

  const handleLeaveGroup = () => {
    if (!groupId) return;

    dialog({
      title: 'Leave this group',
      description:
        'You will no longer see this group or take part in new expenses. Existing settlements remain in the history.',
      submitText: 'Leave group',
      variant: 'danger',
      withIcon: true,
      catchOnCancel: true,
    })
      .then(() => {
        leaveGroup();
      })
      .catch(() => {
        // cancelled
      });
  };

  const archiveButtonLabel = group.is_archived
    ? isArchiving
      ? 'Unarchiving…'
      : 'Unarchive group'
    : isArchiving
      ? 'Archiving…'
      : 'Archive group';

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      {/* General card */}
      <Card className='shadow-sm'>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <Typography variant='b3' className='text-muted-foreground'>
            Basic details about this group.
          </Typography>
        </CardHeader>

        <CardContent className='space-y-3 text-sm'>
          <div className='rounded-lg border bg-card/70 px-3 py-2'>
            <Typography
              variant='c2'
              className='uppercase tracking-wide text-muted-foreground'
            >
              Group name
            </Typography>
            <Typography variant='b3' className='mt-1 font-medium'>
              {group.name}
            </Typography>
          </div>

          {group.description && (
            <div className='rounded-lg border bg-card/70 px-3 py-2'>
              <Typography
                variant='c2'
                className='uppercase tracking-wide text-muted-foreground'
              >
                Description
              </Typography>
              <Typography variant='b3' className='mt-1'>
                {group.description}
              </Typography>
            </div>
          )}

          <div className='rounded-lg border bg-card/70 px-3 py-2'>
            <Typography
              variant='c2'
              className='uppercase tracking-wide text-muted-foreground'
            >
              Category
            </Typography>
            <Typography variant='b3' className='mt-1'>
              {group.category || 'Not set'}
            </Typography>
          </div>

          <ButtonLink href={`/groups/${group.id}/settings`} className='mt-2'>
            Edit group
          </ButtonLink>
        </CardContent>
      </Card>

      {/* Permissions & status card */}
      <Card className='shadow-sm'>
        <CardHeader>
          <CardTitle>Permissions & status</CardTitle>
          <Typography variant='b3' className='text-muted-foreground'>
            How members can interact with expenses in this group.
          </Typography>
        </CardHeader>

        <CardContent className='space-y-3 text-sm'>
          {/* ⬇️ New hint about where to change these settings */}
          <div className='rounded-lg border border-primary-100/70 bg-primary-50/50 px-3 py-2 text-xs text-primary-900 dark:border-primary-900/60 dark:bg-primary-950/40 dark:text-primary-50'>
            {isOwner ? (
              <Typography variant='c2'>
                To change these permissions, use the{' '}
                <span className='font-semibold'>Edit group</span> form.
              </Typography>
            ) : (
              <Typography variant='c2'>
                Only the group owner can change these permissions in the{' '}
                <span className='font-semibold'>Edit group</span> page.
              </Typography>
            )}
          </div>

          <div className='space-y-2'>
            <PermissionRow
              label='Members can edit all expenses'
              enabled={group.members_can_edit_all_expenses}
              helper='When enabled, anyone in the group can adjust any expense.'
            />
            <PermissionRow
              label='Members can delete expenses'
              enabled={group.members_can_delete_expenses}
              helper='When disabled, only owners can remove expenses.'
            />
            <PermissionRow
              label='Locked'
              enabled={group.is_locked}
              helper='Locked groups cannot be changed until unlocked.'
            />
            <PermissionRow
              label='Archived'
              enabled={group.is_archived}
              helper='Archived groups are hidden from your active list.'
            />
          </div>

          <div className='mt-4 flex flex-col gap-2'>
            {isOwner && (
              <Button
                variant='outlineblack'
                onClick={handleArchiveGroup}
                disabled={isArchiving}
              >
                {archiveButtonLabel}
              </Button>
            )}

            <Button
              variant='destructive'
              onClick={handleLeaveGroup}
              disabled={isLeavingGroup}
            >
              {isLeavingGroup ? 'Leaving…' : 'Leave group'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type PermissionRowProps = {
  label: string;
  enabled: boolean;
  helper?: string;
};

function PermissionRow({ label, enabled, helper }: PermissionRowProps) {
  return (
    <div className='rounded-lg border bg-card/70 px-3 py-2'>
      <div className='flex items-center justify-between gap-3'>
        <Typography variant='c1' className='text-primary font-semibold'>
          {label}
        </Typography>

        <span
          className={
            enabled
              ? 'inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
              : 'inline-flex items-center rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-900/70 dark:text-slate-200'
          }
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {helper && (
        <Typography variant='c2' className='mt-1 text-muted-foreground'>
          {helper}
        </Typography>
      )}
    </div>
  );
}
