// esl
'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { convertUrlToFileWithPreview } from '@/lib/form-utils';
import { useUploadFileMutation } from '@/hooks/mutation/useUploadFileMutation';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/card';
import { Checkbox } from '@/components/checkbox';
import { DropzoneInput } from '@/components/dropzone-input';
import withAuth from '@/components/hoc/withAuth';
import { Input } from '@/components/input';
import UserLayout from '@/components/layout/user/user-layout';
import { Select } from '@/components/select';
import { Textarea } from '@/components/textarea';
import { Typography } from '@/components/typography';

import useAuthStore from '@/store/useAuthStore';

import { GROUP_CATEGORY_OPTIONS } from '@/constant/options/group';

import { useUpdateGroupMutation } from './hooks/mutation';
import type { UpdateGroupForm, UpdateGroupRequest } from './types';

import type { ApiResponse } from '@/types/api';
import type { GroupDetail } from '@/types/entities/group';

type RouteParams = {
  groupId: string;
};

function GroupSettingsPage() {
  const params = useParams() as unknown as RouteParams;
  const groupId = params.groupId;
  const user = useAuthStore.useUser();

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

  const methods = useForm<UpdateGroupForm>({
    mode: 'onTouched',
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = methods;

  const iconValue = watch('icon');

  const { mutate: updateGroup, isPending: isUpdating } = useUpdateGroupMutation(
    {
      groupId,
    },
  );

  const { mutateAsync: uploadFile, isPending: isUploadingIcon } =
    useUploadFileMutation('icon');

  // check if current user is owner
  const isOwner = React.useMemo(() => {
    if (!group || !user) return false;
    const me = group.group_members.find((m) => m.user_id === user.id);
    return me?.role === 'OWNER';
  }, [group, user]);

  // Reset form when group detail is ready
  React.useEffect(() => {
    if (!group) return;

    reset({
      name: group.name ?? '',
      description: group.description ?? '',
      category: group.category ?? '',
      icon:
        group.icon_url && group.icon_url !== ''
          ? convertUrlToFileWithPreview({
              url: group.icon_url,
              fileName: `Group-${group.name || group.id}`,
            })
          : null,
      icon_url: group.icon_url ?? null,
      is_locked: group.is_locked ?? false,
      members_can_edit_all_expenses:
        group.members_can_edit_all_expenses ?? false,
      members_can_delete_expenses: group.members_can_delete_expenses ?? false,
    });
  }, [group, reset]);

  const originalHasIcon = !!group?.icon_url;
  const currentHasIcon = Array.isArray(iconValue) && iconValue.length > 0;
  const hasIconChangeForButton = originalHasIcon !== currentHasIcon;

  const onSubmit = (data: UpdateGroupForm) => {
    if (!group) return;

    const payload: UpdateGroupRequest = {};

    // permissions: member can only update name, description, category, icon
    const canEditAll = isOwner;

    // compare text fields
    if (data.name !== group.name) {
      payload.name = data.name;
    }

    if ((data.description ?? '') !== (group.description ?? '')) {
      payload.description = data.description;
    }

    if ((data.category ?? '') !== (group.category ?? '')) {
      payload.category = data.category;
    }

    if (canEditAll) {
      if ((data.is_locked ?? false) !== (group.is_locked ?? false)) {
        payload.is_locked = data.is_locked;
      }

      if (
        (data.members_can_edit_all_expenses ?? false) !==
        (group.members_can_edit_all_expenses ?? false)
      ) {
        payload.members_can_edit_all_expenses =
          data.members_can_edit_all_expenses;
      }

      if (
        (data.members_can_delete_expenses ?? false) !==
        (group.members_can_delete_expenses ?? false)
      ) {
        payload.members_can_delete_expenses = data.members_can_delete_expenses;
      }
    }

    // icon diff
    const originalUrl = group.icon_url ?? null;

    const firstFile =
      Array.isArray(data.icon) && data.icon.length > 0 ? data.icon[0] : null;

    const currentPreviewUrl = (firstFile as any)?.preview ?? null;

    const isIconChanged =
      originalUrl !== currentPreviewUrl ||
      (originalUrl === null && firstFile !== null) ||
      (originalUrl !== null && firstFile === null);

    // if absolutely nothing to update, short-circuit
    if (!isIconChanged && Object.keys(payload).length === 0) {
      toast('No changes to save.');
      return;
    }

    Promise.all([
      isIconChanged
        ? data.icon
          ? uploadFile({ file: data.icon })
          : Promise.resolve(null)
        : Promise.resolve(null),
    ])
      .then(([uploadRes]) => {
        if (isIconChanged) {
          payload.icon_url = uploadRes?.data?.data?.file_url ?? null;
        }

        updateGroup(payload);
      })
      .catch(() => {
        toast.error('Failed to upload group icon.');
      });
  };

  const backHref = `/groups/${groupId}?tab=settings`;

  return (
    <UserLayout backHref={backHref}>
      <section className='flex flex-col gap-6'>
        {isLoading && (
          <Card>
            <CardContent className='py-10'>
              <Typography variant='c1' className='text-muted-foreground'>
                Loading group settings…
              </Typography>
            </CardContent>
          </Card>
        )}

        {isError && !isLoading && (
          <Card>
            <CardContent className='py-10'>
              <Typography variant='c1' className='text-destructive'>
                Failed to load group. Please try again later.
              </Typography>
            </CardContent>
          </Card>
        )}

        {group && (
          <Card className='shadow-sm'>
            <CardHeader>
              <CardTitle>Group profile</CardTitle>
              <Typography variant='b3' className='mt-1 text-muted-foreground'>
                Update the basic details of this group.{' '}
                {!isOwner &&
                  'Some settings are only editable by the group owner.'}
              </Typography>
            </CardHeader>

            <CardContent>
              <FormProvider {...methods}>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className='flex flex-col gap-6'
                >
                  {/* Basic info */}
                  <div className='space-y-4'>
                    <Input
                      id='name'
                      label='Group name'
                      placeholder='e.g. Bali Trip 2025'
                      validation={{ required: 'Group name is required' }}
                    />

                    <Textarea
                      id='description'
                      label='Description'
                      placeholder='Short description about this group (optional).'
                      rows={3}
                    />

                    <Select
                      id='category'
                      label='Category'
                      options={GROUP_CATEGORY_OPTIONS}
                      placeholder='Select group category (optional)'
                    />

                    <DropzoneInput
                      id='icon'
                      label='Group icon'
                      helperText='Upload a square image for this group (PNG/JPG, max 5MB).'
                      maxFiles={1}
                      maxSize={5 * 1024 * 1024}
                      accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
                    />
                  </div>

                  {/* Settings (checkboxes) */}
                  <div className='space-y-3 rounded-lg border bg-card/60 p-4'>
                    <Typography variant='b3' className='font-semibold'>
                      Settings
                    </Typography>

                    <div className='space-y-2'>
                      <Checkbox
                        label='Lock this group (no new expenses or changes from members)'
                        name='is_locked'
                        size='base'
                        disabled={!isOwner}
                      />
                      <Checkbox
                        label='Allow members to edit all expenses'
                        name='members_can_edit_all_expenses'
                        size='base'
                        disabled={!isOwner}
                      />
                      <Checkbox
                        label='Allow members to delete expenses'
                        name='members_can_delete_expenses'
                        size='base'
                        disabled={!isOwner}
                      />
                    </div>

                    {!isOwner && (
                      <Typography
                        variant='c2'
                        className='text-xs text-muted-foreground'
                      >
                        Only the group owner can change these settings.
                      </Typography>
                    )}
                  </div>

                  <div className='flex justify-end'>
                    <Button
                      type='submit'
                      className='w-full sm:w-auto'
                      isLoading={isUpdating || isUploadingIcon}
                      disabled={
                        (!isDirty && !hasIconChangeForButton) ||
                        isUpdating ||
                        isUploadingIcon
                      }
                    >
                      Save changes
                    </Button>
                  </div>
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        )}
      </section>
    </UserLayout>
  );
}

export default withAuth(GroupSettingsPage, 'user');
