'use client';

import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/button';
import { ButtonLink } from '@/components/button-link';
import { NextImage } from '@/components/next-image';
import { Typography } from '@/components/typography';

type InternalServerErrorProps = {
  /** Provided by the Next error boundary; retries the failed render. */
  reset?: () => void;
};

export default function InternalServerError({
  reset,
}: InternalServerErrorProps) {
  return (
    <main
      id='main'
      className='ambient grain relative flex min-h-dvh flex-col overflow-hidden'
    >
      <div className='layout-wide relative flex flex-1 flex-col justify-center py-16'>
        <Link
          href='/'
          className='mb-16 inline-flex w-fit items-center gap-2.5 transition-opacity duration-200 hover:opacity-80'
        >
          <NextImage
            src='/images/logo/logo.png'
            alt='Splibilo'
            width={28}
            height={28}
            className='h-7 w-7'
          />
          <Typography variant='h5' className='font-semibold'>
            Splibilo
          </Typography>
        </Link>

        <p className='eyebrow text-primary-700 dark:text-primary-300 tabular'>
          500
        </p>
        <Typography
          as='h1'
          variant='j1'
          className='mt-4 max-w-[22ch] text-4xl tracking-[-0.035em] md:text-5xl'
        >
          Something on our side failed
        </Typography>
        <Typography
          variant='b2'
          className='text-muted-foreground mt-5 max-w-[52ch] leading-relaxed'
        >
          The request did not go through. Your expenses and balances are safe
          and unchanged. Trying again usually clears it.
        </Typography>

        <div className='mt-10 flex flex-wrap items-center gap-4'>
          <Button
            size='md'
            onClick={() => reset?.() ?? window.location.reload()}
            className='px-6 transition-transform duration-200 active:translate-y-px'
          >
            Try again
          </Button>
          <ButtonLink href='/' size='md' variant='outlineblack' className='px-6'>
            Back to home
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
