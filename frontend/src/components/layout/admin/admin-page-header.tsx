import * as React from 'react';

import { adminBreadcrumb } from '@/lib/content/admin-breadcrumb';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/breadcrumb';
import { SidebarTrigger } from '@/components/layout/admin/sidebar';
import { Separator } from '@/components/separator';

export type Crumb =
  | string
  | {
      href?: string;
      label: string;
    };

type AdminPageHeaderProps = {
  title?: string;
  breadcrumbs?: Crumb[];
};

function normalizeBreadcrumbs(
  crumbs: Crumb[],
): { href?: string; label: string }[] {
  return crumbs.map((crumb) => {
    if (typeof crumb === 'string') {
      return {
        href: crumb,
        label: adminBreadcrumb[crumb] ?? crumb,
      };
    }
    return crumb;
  });
}

export function AdminPageHeader({ breadcrumbs }: AdminPageHeaderProps) {
  const normalized = breadcrumbs ? normalizeBreadcrumbs(breadcrumbs) : [];

  return (
    <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
      <SidebarTrigger className='-ml-1' />
      <Separator orientation='vertical' className='mr-2 h-4' />
      {normalized.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {normalized.map((crumb, index) => {
              const isLast = index === normalized.length - 1;
              return (
                <React.Fragment key={crumb.href ?? crumb.label}>
                  <BreadcrumbItem>
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </header>
  );
}
