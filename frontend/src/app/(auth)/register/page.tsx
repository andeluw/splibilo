'use client';

import * as React from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';

import { useUploadFileMutation } from '@/hooks/mutation/useUploadFileMutation';

import { Button } from '@/components/button';
import { DropzoneInput } from '@/components/dropzone-input';
import { Input } from '@/components/input';
import { NextImage } from '@/components/next-image';
import { PrimaryLink } from '@/components/primary-link';
import { ScrollArea } from '@/components/scroll-area';
import { Typography } from '@/components/typography';

import { RegisterForm } from '@/app/(auth)/register/types';
import { REGEX } from '@/constant/regex';

import useRegisterMutation from './hooks/mutation';

export default function RegisterPage() {
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
    <div className='flex h-screen w-full overflow-hidden'>
      <div className='hidden w-1/2 flex-col items-center justify-center bg-gradient-to-r from-primary-500 to-primary-700 lg:flex'>
        <NextImage
          useSkeleton
          src='/images/logo/logo-bg.png'
          width={200}
          height={200}
          alt='Splibilo Branding'
          className='mb-8 h-32 w-32'
        />
        <Typography
          variant='h1'
          className='text-center text-4xl font-bold text-background'
        >
          Splibilo
        </Typography>
        <Typography
          variant='b1'
          className='mt-4 max-w-md text-center text-background/90'
        >
          Manage your assets efficiently with Splibilo.
        </Typography>
      </div>
      <div className='flex w-full flex-col justify-center bg-background px-4 py-8 lg:w-1/2'>
        <ScrollArea className='h-full w-full'>
          <div className='mx-auto flex w-full max-w-md flex-col justify-center px-4'>
            <div className='pb-6 flex flex-col space-y-2 text-center lg:text-left'>
              <div className='pb-8 flex justify-center lg:justify-start'>
                <NextImage
                  useSkeleton
                  src='/images/logo/logo.png'
                  width={48}
                  height={48}
                  alt='Splibilo Logo'
                  className='h-12 w-12 lg:hidden'
                />
              </div>
              <Typography variant='h1' className='text-primary-800'>
                Create an account
              </Typography>
              <Typography variant='b2' className='text-muted-foreground'>
                Enter your details to create your account
              </Typography>
            </div>

            <FormProvider {...methods}>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className='flex flex-col gap-4'
              >
                <Input
                  id='name'
                  label='Name'
                  placeholder='Enter your name'
                  validation={{ required: 'Name is required' }}
                />
                <Input
                  id='email'
                  label='Email'
                  placeholder='Enter your email'
                  validation={{
                    required: 'Email is required',
                    pattern: {
                      value: REGEX.EMAIL,
                      message: 'Invalid email address',
                    },
                  }}
                />
                <Input
                  id='password'
                  label='Password'
                  type='password'
                  placeholder='Create a password'
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
                  label='Confirm Password'
                  type='password'
                  placeholder='Confirm your password'
                  validation={{
                    required: 'Confirm Password is required',
                    validate: (value) =>
                      value === password || "Passwords don't match",
                  }}
                />

                <DropzoneInput
                  id='avatar'
                  label='Profile Picture'
                  accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
                  maxFiles={1}
                  maxSize={5 * 1024 * 1024}
                  helperText='File must not exceed 5MB'
                  containerClassName='w-full'
                />

                <Button
                  type='submit'
                  className='mt-2 w-full'
                  isLoading={isPending}
                  disabled={!isValid}
                >
                  Register
                </Button>
              </form>
            </FormProvider>

            <div className='mt-4 text-center text-sm text-muted-foreground'>
              Already have an account?{' '}
              <PrimaryLink href='/login'>Login</PrimaryLink>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
