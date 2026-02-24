'use client';

import { ArrowLeft } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

import { ButtonLink } from '@/components/button-link';
import { Navbar } from '@/components/layout/user/navbar';

type UserLayoutProps = {
  children: React.ReactNode;
  className?: string;
  backHref?: string;
  noLayout?: boolean;
};

export default function UserLayout({
  children,
  className,
  backHref,
  noLayout = false,
}: UserLayoutProps) {
  return (
    <div className='flex min-h-screen flex-col bg-background text-foreground'>
      <Navbar />
      <main className={cn(!noLayout && 'layout flex-1 py-8', className)}>
        {backHref && (
          <ButtonLink
            href={backHref}
            variant='outlineblack'
            size='md'
            className='mb-6 py-1.5'
            leftIcon={ArrowLeft}
          >
            Back
          </ButtonLink>
        )}
        {children}
      </main>
    </div>
  );
}
