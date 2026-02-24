'use client';

import * as React from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/components/button';
import withAuth from '@/components/hoc/withAuth';
import { Input } from '@/components/input';
import { NextImage } from '@/components/next-image';
import { PrimaryLink } from '@/components/primary-link';
import { Typography } from '@/components/typography';

import useLoginMutation from '@/app/(auth)/login/hooks/mutation';
import { LoginForm } from '@/app/(auth)/login/types';
import { REGEX } from '@/constant/regex';

export default withAuth(LoginPage, 'public');
function LoginPage() {
  const methods = useForm<LoginForm>({
    mode: 'onTouched',
  });
  const {
    handleSubmit,
    formState: { isValid },
  } = methods;
  const { mutate, isPending } = useLoginMutation();

  const onSubmit: SubmitHandler<LoginForm> = (data) => {
    mutate(data);
  };

  return (
    <div className='flex h-screen w-full overflow-hidden'>
      <div className='flex w-full flex-col justify-center bg-background px-4 py-8 lg:w-1/2 h-screen'>
        <div className='mx-auto flex w-full max-w-md flex-col justify-center px-4'>
          <div className='mb-6 flex flex-col space-y-2 text-center lg:text-left'>
            <div className='mb-8 flex justify-center lg:justify-start'>
              <NextImage
                useSkeleton
                src='/images/logo/logo.png'
                width={48}
                height={48}
                alt='Splibilo Logo'
                className='h-12 w-12 lg:hidden'
              />
            </div>
            <Typography variant='h1' className='font-bold text-primary-800'>
              Login
            </Typography>
            <Typography variant='b2' className='text-muted-foreground'>
              Login to your account to continue
            </Typography>
          </div>

          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className='flex flex-col gap-4'
            >
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
                placeholder='Enter your password'
                validation={{
                  required: 'Password is required',
                }}
              />

              <Button
                type='submit'
                className='mt-2 w-full'
                isLoading={isPending}
                disabled={!isValid}
              >
                Login
              </Button>
            </form>
          </FormProvider>

          <div className='mt-4 text-center text-sm text-muted-foreground'>
            Don&apos;t have an account?{' '}
            <PrimaryLink href='/register'>Register</PrimaryLink>
          </div>
        </div>
      </div>

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
    </div>
  );
}
