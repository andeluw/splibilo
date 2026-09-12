'use client';

import { Pencil, User2 } from 'lucide-react';
import * as React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { convertUrlToFileWithPreview } from '@/lib/form-utils';
import logger from '@/lib/logger';
import { useUploadFileMutation } from '@/hooks/mutation/useUploadFileMutation';

import { Button } from '@/components/button';
import { Card, CardContent, CardHeader } from '@/components/card';
import { Checkbox } from '@/components/checkbox';
import { DropzoneInput } from '@/components/dropzone-input';
import withAuth from '@/components/hoc/withAuth';
import { Input } from '@/components/input';
import UserLayout from '@/components/layout/user/user-layout';
import { NextImage } from '@/components/next-image';
import { Typography } from '@/components/typography';

import useAuthStore from '@/store/useAuthStore';

import { useUpdateMeMutation } from '@/app/(app)/profile/hooks/mutation';
import { UpdateMeForm, UpdateMeRequest } from '@/app/(app)/profile/types';

function ProfilePage() {
  const [isEditMode, setIsEditMode] = React.useState(false);
  const profile = useAuthStore.useUser();

  const methods = useForm<UpdateMeForm>({
    mode: 'onTouched',
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = methods;

  const avatarValue = watch('avatar');

  const { mutate: updateMe, isPending: isUpdating } = useUpdateMeMutation();
  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } =
    useUploadFileMutation('avatar');

  // Reset form when profile is ready
  React.useEffect(() => {
    if (!profile) return;

    reset({
      name: profile.name ?? '',
      email: profile.email,
      avatar:
        profile.avatar_url && profile.avatar_url !== ''
          ? convertUrlToFileWithPreview({
              url: profile.avatar_url,
              fileName: 'Avatar',
            })
          : undefined,
      email_on_settlement_received:
        profile.email_on_settlement_received ?? true,
    });
  }, [profile, reset]);

  const originalHasAvatar = !!profile?.avatar_url;
  const currentHasAvatar = Array.isArray(avatarValue) && avatarValue.length > 0;
  const hasAvatarChangeForButton = originalHasAvatar !== currentHasAvatar;

  const onSubmit = (data: UpdateMeForm) => {
    if (!profile) return;

    const originalUrl = profile.avatar_url ?? null;

    const firstFile =
      Array.isArray(data.avatar) && data.avatar.length > 0
        ? data.avatar[0]
        : null;

    const currentPreviewUrl = firstFile?.preview ?? null;

    const isAvatarChanged =
      originalUrl !== currentPreviewUrl ||
      (originalUrl === null && firstFile !== null) ||
      (originalUrl !== null && firstFile === null);

    Promise.all([
      isAvatarChanged && data.avatar
        ? uploadAvatar({ file: data.avatar })
        : Promise.resolve(null),
    ])
      .then(([uploadRes]) => {
        const payload: UpdateMeRequest = {
          name: data.name || undefined,
          email_on_settlement_received: data.email_on_settlement_received,
        };

        if (isAvatarChanged) {
          payload.avatar_url = uploadRes?.data?.data?.file_url ?? null;
        }

        updateMe(payload, {
          onSuccess: () => {
            setIsEditMode(false);
          },
        });
      })
      .catch((err) => {
        logger(err, 'Failed to upload avatar');
      });
  };

  const isSubmitDisabled =
    (!isDirty && !hasAvatarChangeForButton) ||
    !isEditMode ||
    isUpdating ||
    isUploadingAvatar;

  const currentAvatarUrl =
    (Array.isArray(avatarValue) && avatarValue[0]?.preview) ||
    profile?.avatar_url ||
    '';

  return (
    <UserLayout>
      <section className='flex flex-col gap-6'>
        <div className='flex flex-col gap-2'>
          <Typography
            as='h1'
            variant='h1'
            className='text-primary-800 dark:text-primary-200'
          >
            Profile
          </Typography>
          <Typography variant='b3' className='text-muted-foreground'>
            Manage your personal info and Splibilo preferences.
          </Typography>
        </div>

        {profile && (
          <Card className='shadow-sm'>
            <CardHeader className='flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-4'>
                <div className='relative h-16 w-16 overflow-hidden rounded-full border border-primary-100 bg-primary-50 dark:border-primary-900/60 dark:bg-primary-950/40'>
                  {currentAvatarUrl ? (
                    <div className='w-full h-full'>
                      <NextImage
                        src={currentAvatarUrl}
                        alt={profile.name ?? 'Profile avatar'}
                        layout='fill'
                        imgClassName='object-cover object-center'
                      />
                    </div>
                  ) : (
                    <div className='flex h-full w-full items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-200'>
                      <User2 className='h-8 w-8 opacity-80' />
                    </div>
                  )}
                </div>
                <div>
                  <Typography
                    variant='h2'
                    className='font-semibold text-primary-900 dark:text-primary-50'
                  >
                    {profile.name || 'Unnamed user'}
                  </Typography>
                  <Typography variant='b3' className='text-muted-foreground'>
                    {profile.email}
                  </Typography>
                </div>
              </div>

              <div className='flex flex-wrap gap-2'>
                {!isEditMode && (
                  <Button
                    type='button'
                    size='sm'
                    rightIcon={Pencil}
                    onClick={() => setIsEditMode(true)}
                  >
                    Edit profile
                  </Button>
                )}
                {isEditMode && (
                  <Button
                    type='button'
                    size='sm'
                    variant='outlineblack'
                    onClick={() => {
                      // revert changes to latest profile state
                      reset({
                        name: profile.name ?? '',
                        email: profile.email,
                        avatar:
                          profile.avatar_url && profile.avatar_url !== ''
                            ? convertUrlToFileWithPreview({
                                url: profile.avatar_url,
                                fileName: 'Avatar',
                              })
                            : undefined,
                        email_on_settlement_received:
                          profile.email_on_settlement_received ?? true,
                      });
                      setIsEditMode(false);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className='pt-6'>
              <FormProvider {...methods}>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className='flex flex-col gap-6'
                >
                  {/* Basic info */}
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <Input
                      id='name'
                      label='Name'
                      placeholder='Your full name'
                      disabled={!isEditMode}
                    />
                    <Input
                      id='email'
                      label='Email'
                      placeholder='you@example.com'
                      readOnly
                      disabled
                      helperText='Email is managed by your account and cannot be changed here.'
                    />
                  </div>

                  {/* Avatar */}
                  <DropzoneInput
                    id='avatar'
                    label='Profile picture'
                    helperText='Upload a square image (PNG/JPG, max 5MB) for best results.'
                    maxFiles={1}
                    maxSize={5 * 1024 * 1024}
                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
                    readOnly={!isEditMode}
                  />

                  {/* Preferences */}
                  <div className='rounded-lg border bg-card/70 p-4'>
                    <Typography variant='b3' className='mb-2 font-semibold'>
                      Notification preferences
                    </Typography>
                    <Typography
                      variant='c2'
                      className='mb-3 text-xs text-muted-foreground'
                    >
                      Control how Splibilo keeps you in the loop about
                      settlements.
                    </Typography>

                    <Checkbox
                      name='email_on_settlement_received'
                      label='Email me when someone records a settlement involving me'
                      disabled={!isEditMode}
                    />
                  </div>

                  {isEditMode && (
                    <div className='flex justify-end'>
                      <Button
                        type='submit'
                        className='w-full sm:w-auto'
                        isLoading={isUpdating || isUploadingAvatar}
                        disabled={isSubmitDisabled}
                      >
                        Save changes
                      </Button>
                    </div>
                  )}
                </form>
              </FormProvider>
            </CardContent>
          </Card>
        )}
      </section>
    </UserLayout>
  );
}

export default withAuth(ProfilePage, 'user');
