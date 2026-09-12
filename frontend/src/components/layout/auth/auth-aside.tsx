import Link from 'next/link';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { NextImage } from '@/components/next-image';
import { Typography } from '@/components/typography';

/** Brand column beside the auth forms. Hidden below lg, where the form takes
 *  the whole screen and the compact logo header stands in for it. Sticky so a
 *  long form (register) does not stretch it into a mostly empty panel. */
export function AuthAside({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'ambient grain bg-primary-50/70 dark:bg-primary-950/40 relative hidden flex-col justify-between overflow-hidden p-12',
        'lg:sticky lg:top-0 lg:flex lg:h-dvh',
        className,
      )}
    >
      <Link
        href='/'
        className='relative inline-flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80'
      >
        <NextImage
          src='/images/logo/logo.png'
          alt='Splibilo'
          width={32}
          height={32}
          className='h-8 w-8'
        />
        <Typography variant='h4' className='font-semibold'>
          Splibilo
        </Typography>
      </Link>

      <div className='relative max-w-md'>
        <Typography
          as='p'
          variant='j2'
          className='font-display text-3xl leading-[1.15] tracking-[-0.03em]'
        >
          Everyone paid something.{' '}
          <span className='text-muted-foreground'>
            Nobody knows what they owe.
          </span>
        </Typography>
      </div>

      <div aria-hidden />
    </aside>
  );
}
