import { Metadata } from 'next';
import * as React from 'react';

import { seoConfig } from '@/config/seo';

export const metadata: Metadata = seoConfig({
  title: 'Login',
  description: 'Login to your account',
});

export default function layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
