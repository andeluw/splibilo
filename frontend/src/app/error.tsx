'use client';

import * as React from 'react';

import logger from '@/lib/logger';

import InternalServerError from '@/app/(common)/InternalServerError';

// Error boundaries are client components, so they cannot export metadata.
export default function Page({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    logger(error, 'Unhandled render error');
  }, [error]);

  return <InternalServerError reset={reset} />;
}
