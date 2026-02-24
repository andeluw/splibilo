'use client';
import { ReceiptText, Users, Users2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/card';
import withAuth from '@/components/hoc/withAuth';
import { AdminLayout } from '@/components/layout/admin/admin-layout';
import { Typography } from '@/components/typography';
import { UnstyledLink } from '@/components/unstyled-link';

const adminSections = [
  {
    title: 'Platform Management',
    caption: 'Quick access to the core data of Splibilo.',
    pages: [
      {
        title: 'User List',
        url: '/admin/users',
        caption: 'View and manage all registered users.',
        icon: Users,
      },
      {
        title: 'Group List',
        url: '/admin/groups',
        caption: 'Monitor and moderate all expense groups.',
        icon: Users2,
      },
      {
        title: 'Expense List',
        url: '/admin/expenses',
        caption: 'Review all recorded expenses on the platform.',
        icon: ReceiptText,
      },
    ],
  },
];

export default withAuth(DashboardAdminPage, 'admin');
function DashboardAdminPage() {
  return (
    <AdminLayout
      breadcrumbs={['/admin']}
      title='Admin Dashboard'
      subheading='Welcome to the admin dashboard. Manage users, groups, and expenses in one place.'
    >
      <div className='flex flex-col gap-8'>
        {adminSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.caption}</CardDescription>
            </CardHeader>

            <CardContent className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
              {section.pages.map((page) => (
                <UnstyledLink
                  key={page.title}
                  href={page.url}
                  className='flex flex-col items-center justify-center gap-1.5 rounded-lg border border-border p-4 text-center transition-colors hover:bg-primary-50 dark:hover:bg-primary-950/40'
                >
                  <div className='flex h-14 w-14 items-center justify-center rounded-md bg-primary-100 p-2 text-primary-800 dark:bg-primary-900 dark:text-primary-50'>
                    <page.icon className='h-8 w-8' />
                  </div>

                  <Typography
                    variant='s3'
                    className='mt-2 font-semibold text-primary-800 dark:text-primary-50'
                  >
                    {page.title}
                  </Typography>

                  <Typography variant='s4' className='text-muted-foreground'>
                    {page.caption}
                  </Typography>
                </UnstyledLink>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
