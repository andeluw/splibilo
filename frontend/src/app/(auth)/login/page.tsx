'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/components/button';
import withAuth from '@/components/hoc/withAuth';
import { Input } from '@/components/input';
import { AuthAside } from '@/components/layout/auth/auth-aside';
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
    <div className='grid min-h-dvh lg:grid-cols-[1.05fr_1fr]'>
      <AuthAside />

      <main
        id='main'
        className='bg-background flex flex-col justify-center px-6 py-10 sm:px-10'
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
            Welcome back
          </Typography>
          <Typography variant='b3' className='text-muted-foreground mt-2'>
            Sign in to pick up where your groups left off.
          </Typography>

          <FormProvider {...methods}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className='mt-8 flex flex-col gap-4'
            >
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
                autoComplete='current-password'
                placeholder='Your password'
                validation={{
                  required: 'Password is required',
                }}
              />

              <Button
                type='submit'
                size='md'
                className='mt-3 w-full transition-transform duration-200 active:translate-y-px'
                isLoading={isPending}
                disabled={!isValid}
              >
                Sign in
              </Button>
            </form>
          </FormProvider>

          <Typography
            variant='b3'
            className='text-muted-foreground mt-8 text-center'
          >
            No account yet? <PrimaryLink href='/register'>Register</PrimaryLink>
          </Typography>
        </div>
      </main>
    </div>
  );
}
