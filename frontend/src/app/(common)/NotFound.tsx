import Link from 'next/link';

import { ButtonLink } from '@/components/button-link';
import { NextImage } from '@/components/next-image';
import { Typography } from '@/components/typography';

const elsewhere = [
  { label: 'Your groups', href: '/groups', hint: 'Balances and expenses' },
  { label: 'Activity', href: '/activity', hint: 'Everything that moved' },
  { label: 'Sign in', href: '/login', hint: 'If you were signed out' },
];

export default function NotFound() {
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
          404
        </p>
        <Typography
          as='h1'
          variant='j1'
          className='mt-4 max-w-[20ch] text-4xl tracking-[-0.035em] md:text-5xl'
        >
          This page is not here
        </Typography>
        <Typography
          variant='b2'
          className='text-muted-foreground mt-5 max-w-[52ch] leading-relaxed'
        >
          The link may be old, or the group it pointed at was removed. Nothing
          on your account has changed.
        </Typography>

        <div className='mt-10'>
          <ButtonLink
            href='/'
            size='md'
            className='px-6 transition-transform duration-200 active:translate-y-px'
          >
            Back to home
          </ButtonLink>
        </div>

        <ul className='border-border/70 mt-20 grid gap-px border-t sm:grid-cols-3'>
          {elsewhere.map((item) => (
            <li key={item.href} className='py-6 sm:pr-8'>
              <Link
                href={item.href}
                className='group inline-block transition-opacity duration-200 hover:opacity-70'
              >
                <Typography variant='s2'>{item.label}</Typography>
                <Typography
                  variant='b3'
                  className='text-muted-foreground mt-1.5'
                >
                  {item.hint}
                </Typography>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
