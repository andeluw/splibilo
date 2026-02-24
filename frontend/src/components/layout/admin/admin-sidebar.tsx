'use client';

import { LogOut, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { adminNav } from '@/lib/content/admin-nav';
import useLogoutMutation from '@/hooks/mutation/useLogoutMutation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/layout/admin/sidebar';
import { Typography } from '@/components/typography';

import useAuthStore from '@/store/useAuthStore';

export function AdminSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const logout = useAuthStore.useLogout();

  const { mutate: logoutMutation } = useLogoutMutation();

  return (
    <Sidebar {...props}>
      {/* === Logo Section === */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href='/' className='flex items-center gap-2 px-2 py-3'>
              <Image
                src='/images/logo/logo.png'
                alt='Splibilo logo'
                width={32}
                height={32}
                className='h-8 w-8 rounded-md'
              />
              <Typography variant='h3' className='font-bold text-primary-800'>
                Splibilo
              </Typography>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* === Main Navigation === */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {adminNav.navMain.map((item) => {
              const isActive = item.exactMatch
                ? pathname === item.url
                : pathname.startsWith(item.url);

              return (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.url}>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* === Bottom Section (Profile + Logout) === */}
      <SidebarFooter>
        <SidebarMenu>
          {/* Profile */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href='/profile'>
                <User className='h-4 w-4' />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Logout */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logoutMutation()}
              className='text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/40'
            >
              <LogOut className='h-4 w-4' />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
