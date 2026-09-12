import Link from 'next/link';
import * as React from 'react';

import { NextImage } from '@/components/next-image';
import { Typography } from '@/components/typography';

const productLinks = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Receipt scanning', href: '/#receipts' },
  { label: 'Settlements', href: '/#settlements' },
];

const accountLinks = [
  { label: 'Sign in', href: '/login' },
  { label: 'Create an account', href: '/register' },
];

const legalLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
];

export function SiteFooter() {
  return (
    <footer className='border-border/70 border-t'>
      <div className='layout-wide py-14 md:py-16'>
        <div className='grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]'>
          <div className='max-w-sm'>
            <Link href='/' className='inline-flex items-center gap-2.5'>
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
            <Typography
              variant='b3'
              className='text-muted-foreground mt-4 leading-relaxed'
            >
              Shared expenses for groups who would rather not keep a
              spreadsheet. Scan the receipt, split it, settle up.
            </Typography>
          </div>

          <nav aria-label='Product'>
            <Typography className='eyebrow text-muted-foreground'>
              Product
            </Typography>
            <ul className='mt-4 space-y-2.5'>
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label='Account'>
            <Typography className='eyebrow text-muted-foreground'>
              Account
            </Typography>
            <ul className='mt-4 space-y-2.5'>
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-muted-foreground hover:text-foreground text-sm transition-colors duration-200'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className='border-border/70 mt-12 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between'>
          <Typography variant='c1' className='text-muted-foreground'>
            © {new Date().getFullYear()} Splibilo
          </Typography>
          <ul className='flex items-center gap-6'>
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className='text-muted-foreground hover:text-foreground text-xs transition-colors duration-200'
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
