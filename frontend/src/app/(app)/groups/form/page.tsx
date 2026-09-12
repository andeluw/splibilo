'use client';

import { FormProvider, useForm } from 'react-hook-form';

import { useUploadFileMutation } from '@/hooks/mutation/useUploadFileMutation';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Checkbox } from '@/components/checkbox';
import { DropzoneInput } from '@/components/dropzone-input';
import withAuth from '@/components/hoc/withAuth';
import { Input } from '@/components/input';
import UserLayout from '@/components/layout/user/user-layout';
import { Select } from '@/components/select';
import { Textarea } from '@/components/textarea';
import { Typography } from '@/components/typography';

import { useCreateGroupMutation } from '@/app/(app)/groups/form/hooks/mutation';
import type { CreateGroupForm } from '@/app/(app)/groups/form/types';
import { GROUP_CATEGORY_OPTIONS } from '@/constant/options/group';

export default withAuth(CreateGroupPage, 'user');
function CreateGroupPage() {
  const methods = useForm<CreateGroupForm>({
    mode: 'onTouched',
    defaultValues: {
      name: '',
      description: '',
      category: '',
      icon: null,
      members_can_edit_all_expenses: true,
      members_can_delete_expenses: false,
    },
  });

  const {
    handleSubmit,
    formState: { isValid },
  } = methods;

  const { mutate: createGroupMutation, isPending: isCreatingGroup } =
    useCreateGroupMutation();

  const { mutateAsync: uploadFile, isPending: isUploading } =
    useUploadFileMutation('avatar');

  const onSubmit = (data: CreateGroupForm) => {
    const hasAvatarFile = !!data.icon;

    Promise.all([
      hasAvatarFile ? uploadFile({ file: data.icon! }) : Promise.resolve(null),
    ]).then(([uploadRes]) => {
      createGroupMutation({
        name: data.name,
        description: data.description,
        category: data.category,
        ...(hasAvatarFile
          ? { icon_url: uploadRes?.data.data.file_url }
          : undefined),
        members_can_edit_all_expenses: data.members_can_edit_all_expenses,
        members_can_delete_expenses: data.members_can_delete_expenses,
      });
    });
  };

  return (
    <UserLayout>
      <section className='flex flex-col gap-8'>
        <div className='flex flex-col gap-2'>
          <Typography as='h1' variant='h1' className='text-primary-800 dark:text-primary-200'>
            Create Group
          </Typography>
          <Typography variant='b3' className='text-muted-foreground'>
            Set up a new shared expense group for your trip, household, or
            friends.
          </Typography>
        </div>

        <Card>
          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className='flex flex-col gap-6 p-6 sm:p-8'
            >
              <Input
                id='name'
                label='Group Name'
                placeholder='e.g. Bali Trip 2025'
                validation={{ required: 'Group name is required' }}
              />

              <Textarea
                id='description'
                label='Description'
                placeholder='Describe your group (optional)'
                rows={4}
              />

              <Select
                id='category'
                label='Category'
                options={GROUP_CATEGORY_OPTIONS}
                placeholder='Select a category'
                helperText='Choose the category that best fits this group.'
                validation={{ required: 'Category is required' }}
              />

              <DropzoneInput
                id='icon'
                label='Group Icon'
                helperText='Upload an icon for your group (PNG/JPG, max 5MB). You can leave this empty for a default icon.'
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
              />

              <div className='space-y-2'>
                <Checkbox
                  name='members_can_edit_all_expenses'
                  label='Members can edit all expenses'
                  size='base'
                />
                <Typography variant='c1' className='text-muted-foreground'>
                  Allow group members to edit any expense, not only the ones
                  they created.
                </Typography>
              </div>

              <div className='space-y-2'>
                <Checkbox
                  name='members_can_delete_expenses'
                  label='Members can delete expenses'
                  size='base'
                />
                <Typography variant='c1' className='text-muted-foreground'>
                  Give members permission to delete expenses. You might want to
                  keep this off for bigger groups.
                </Typography>
              </div>

              <div className='flex justify-end'>
                <Button
                  type='submit'
                  className='w-full sm:w-auto'
                  isLoading={isCreatingGroup || isUploading}
                  disabled={!isValid || isCreatingGroup || isUploading}
                >
                  Create Group
                </Button>
              </div>
            </form>
          </FormProvider>
        </Card>
      </section>
    </UserLayout>
  );
}
