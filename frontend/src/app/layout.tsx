import type { Metadata } from 'next';
import * as React from 'react';

import '@/styles/globals.css';

import Providers from '@/app/providers';
import { seoConfig } from '@/config/seo';

export const metadata: Metadata = seoConfig({
  title: 'Spilibilo',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className='bg-white dark:bg-[#020817]' suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
