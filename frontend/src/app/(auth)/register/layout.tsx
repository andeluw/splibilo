import { Metadata } from 'next';
import * as React from 'react';

import { seoConfig } from '@/config/seo';

export const metadata: Metadata = seoConfig({
  title: 'Register',
  description: 'Create an account to get started',
});

export default function layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
