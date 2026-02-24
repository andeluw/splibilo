import { ArrowLeft } from 'lucide-react';

import { IconLink } from '@/components/icon-link';
import {
  AdminPageHeader,
  Crumb,
} from '@/components/layout/admin/admin-page-header';
import { AdminSidebar } from '@/components/layout/admin/admin-sidebar';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/layout/admin/sidebar';
import { Skeleton } from '@/components/skeleton';
import { Typography } from '@/components/typography';

export function AdminLayout({
  breadcrumbs,
  title,
  subheading,
  children,
  isLoading,
  backHref,
}: {
  breadcrumbs: Crumb[];
  title: string;
  subheading?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  backHref?: string;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className='min-w-0'>
        <AdminPageHeader breadcrumbs={breadcrumbs} />
        <div
          className='
            flex flex-1 flex-col gap-8
            px-8 py-6 md:px-12 md:py-8 lg:px-16 lg:py-10
            bg-primary-foreground
            w-full max-w-full
            overflow-x-hidden
          '
        >
          <div className='flex items-center gap-5'>
            {backHref && (
              <IconLink
                href={backHref}
                icon={ArrowLeft}
                variant='light'
                className='h-8 w-8'
              />
            )}

            <div className='flex flex-col gap-1.5'>
              <Typography variant='h1'>{title}</Typography>
              <Typography variant='b3' className='text-muted-foreground'>
                {subheading}
              </Typography>
            </div>
          </div>

          {isLoading ? (
            <div className='flex h-full -mt-2 flex-col gap-4'>
              <Skeleton className='h-full w-full' />
            </div>
          ) : (
            children
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
