import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Geist } from 'next/font/google';
import * as React from 'react';

import '@/styles/globals.css';

import Providers from '@/app/providers';
import { seoConfig } from '@/config/seo';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});

const displayFace = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display-face',
  display: 'swap',
});

export const metadata: Metadata = seoConfig({});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfbfd' },
    { media: '(prefers-color-scheme: dark)', color: '#1b1b26' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={`${geistSans.variable} ${displayFace.variable}`}
    >
      <body className='bg-background text-foreground' suppressHydrationWarning>
        <a href='#main' className='skip-link'>
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
