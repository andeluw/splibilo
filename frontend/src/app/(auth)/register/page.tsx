'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';

import { useUploadFileMutation } from '@/hooks/mutation/useUploadFileMutation';

import { Button } from '@/components/button';
import { DropzoneInput } from '@/components/dropzone-input';
import withAuth from '@/components/hoc/withAuth';
import { Input } from '@/components/input';
import { AuthAside } from '@/components/layout/auth/auth-aside';
import { NextImage } from '@/components/next-image';
import { PrimaryLink } from '@/components/primary-link';
import { Typography } from '@/components/typography';

import { RegisterForm } from '@/app/(auth)/register/types';
import { REGEX } from '@/constant/regex';

import useRegisterMutation from './hooks/mutation';

export default withAuth(RegisterPage, 'public');
function RegisterPage() {
  const methods = useForm<RegisterForm>({
    mode: 'onTouched',
  });
  const {
    handleSubmit,
    formState: { isValid },
    watch,
  } = methods;

  const { mutate: register, isPending: isRegisterPending } =
    useRegisterMutation();
  const { mutateAsync: uploadFile, isPending: isUploading } =
    useUploadFileMutation('avatar');

  const onSubmit: SubmitHandler<RegisterForm> = async (data) => {
    const hasAvatarFile = !!data.avatar;
    Promise.all([
      hasAvatarFile
        ? data.avatar
          ? uploadFile({ file: data.avatar })
          : Promise.resolve(null)
        : Promise.resolve(null),
    ]).then(([uploadRes]) =>
      register({
        name: data.name,
        email: data.email,
        password: data.password,
        ...((hasAvatarFile && { avatarUrl: uploadRes?.data.data.file_url }) ??
          undefined),
      }),
    );
  };

  const isPending = isRegisterPending || isUploading;
  const password = watch('password');

  return (
    <div className='grid min-h-dvh lg:grid-cols-[1fr_1.05fr]'>
      <main
        id='main'
        className='bg-background order-2 flex flex-col justify-center px-6 py-10 sm:px-10 lg:order-1'
      >
        <div className='mx-auto w-full max-w-md'>
          <Link
            href='/'
            className='text-muted-foreground hover:text-foreground mb-10 inline-flex items-center gap-2 text-sm transition-colors duration-200'
          >
            <ArrowLeft className='h-4 w-4' strokeWidth={1.5} aria-hidden />
            Back to home
          </Link>

          <NextImage
            src='/images/logo/logo.png'
            width={40}
            height={40}
            alt='Splibilo'
            className='mb-6 h-10 w-10 lg:hidden'
          />

          <Typography
            as='h1'
            variant='j2'
            className='text-3xl tracking-[-0.03em]'
          >
            Create your account
          </Typography>
          <Typography variant='b3' className='text-muted-foreground mt-2'>
            Then invite the people you have been splitting bills with.
          </Typography>

          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className='mt-8 flex flex-col gap-4'
            >
              <Input
                id='name'
                label='Name'
                autoComplete='name'
                placeholder='How your group will see you'
                validation={{ required: 'Name is required' }}
              />
              <Input
                id='email'
                label='Email'
                type='email'
                autoComplete='email'
                placeholder='you@example.com'
                validation={{
                  required: 'Email is required',
                  pattern: {
                    value: REGEX.EMAIL,
                    message: 'Enter a valid email address',
                  },
                }}
              />
              <Input
                id='password'
                label='Password'
                type='password'
                autoComplete='new-password'
                placeholder='At least 8 characters'
                validation={{
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                }}
              />
              <Input
                id='confirm_password'
                label='Confirm password'
                type='password'
                autoComplete='new-password'
                placeholder='Type it once more'
                validation={{
                  required: 'Please confirm your password',
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                }}
              />

              <DropzoneInput
                id='avatar'
                label='Profile picture'
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                helperText='Optional. PNG or JPG, up to 5MB.'
                containerClassName='w-full'
              />

              <Button
                type='submit'
                size='md'
                className='mt-3 w-full transition-transform duration-200 active:translate-y-px'
                isLoading={isPending}
                disabled={!isValid}
              >
                Create account
              </Button>
            </form>
          </FormProvider>

          <Typography
            variant='b3'
            className='text-muted-foreground mt-8 text-center'
          >
            Already registered? <PrimaryLink href='/login'>Sign in</PrimaryLink>
          </Typography>

          <Typography
            variant='c1'
            className='text-muted-foreground mt-6 text-center'
          >
            By creating an account you agree to our{' '}
            <PrimaryLink href='/terms' variant='basic' className='underline'>
              terms
            </PrimaryLink>{' '}
            and{' '}
            <PrimaryLink href='/privacy' variant='basic' className='underline'>
              privacy policy
            </PrimaryLink>
            .
          </Typography>
        </div>
      </main>

      <AuthAside className='order-1 lg:order-2' />
    </div>
  );
}
