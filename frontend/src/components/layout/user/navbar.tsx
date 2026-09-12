'use client';

import {
  ChevronDown,
  CircleUserRound,
  LogOut,
  Menu,
  User as UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { cn } from '@/lib/utils';
import useLogoutMutation from '@/hooks/mutation/useLogoutMutation';

import { Button } from '@/components/button';
import { ButtonLink } from '@/components/button-link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/dropdown-menu';
import { NextImage } from '@/components/next-image';
import { PrimaryLink } from '@/components/primary-link';
import { ScrollArea } from '@/components/scroll-area';
import { Separator } from '@/components/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/sheet';
import { Typography } from '@/components/typography';

import useAuthStore from '@/store/useAuthStore';

import type { User } from '@/types/entities/user';

type MainNavItem = {
  title: string;
  url: string;
  exactMatch?: boolean;
};

const mainNav: MainNavItem[] = [
  { title: 'Home', url: '/', exactMatch: true },
  { title: 'Groups', url: '/groups' },
  { title: 'Activity', url: '/activity' },
];

function getInitials(user?: User | null) {
  if (!user?.name) return 'US';
  const parts = user.name.trim().split(' ').filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function DesktopUserMenu({ user }: { user: User | null }) {
  //#region  //*=========== Mutation ===========
  const { mutate: logoutMutation } = useLogoutMutation();
  //#endregion  //*======== Mutation ===========

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className='flex items-center gap-2 rounded-lg border bg-card px-3 py-2 transition-colors hover:bg-accent'>
          <CircleUserRound className='h-6 w-6' />
          <div className='flex flex-col items-start'>
            <Typography variant='s3' className='font-medium'>
              {user?.name ?? 'Signed in'}
            </Typography>
            <Typography
              variant='c1'
              className='text-muted-foreground truncate max-w-[160px]'
            >
              {user?.email ?? 'Authenticated user'}
            </Typography>
          </div>
          <ChevronDown className='ml-1 h-4 w-4 text-muted-foreground' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <div className='px-2 py-1.5'>
          <Typography variant='c1' className='text-muted-foreground'>
            Signed in as
          </Typography>
          <Typography variant='s3' className='font-medium truncate'>
            {user?.email ?? 'Unknown'}
          </Typography>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href='/profile'
            className='flex cursor-pointer items-center gap-2'
          >
            <UserIcon className='h-4 w-4' />
            <Typography variant='s3'>Profile</Typography>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='cursor-pointer text-destructive focus:text-destructive'
          onClick={() => logoutMutation()}
        >
          <LogOut className='mr-1 h-4 w-4' />
          <Typography variant='s3'>Logout</Typography>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);

  const user = useAuthStore.useUser();
  const isAuthed = useAuthStore.useIsAuthed();

  //#region  //*=========== Mutation ===========
  const { mutate: logoutMutation } = useLogoutMutation();
  //#endregion  //*======== Mutation ===========

  const isActive = (url: string, exactMatch?: boolean) => {
    if (exactMatch) return pathname === url;
    if (url === '/') return pathname === '/';
    return pathname.startsWith(url);
  };

  return (
    <header className='bg-background/80 supports-[backdrop-filter]:bg-background/65 sticky top-0 z-50 w-full border-b backdrop-blur-md'>
      <div className='layout-wide flex h-16 items-center justify-between gap-4 sm:h-20'>
        {/* Brand */}
        <Link
          href='/'
          className='flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80'
        >
          <NextImage
            src='/images/logo/logo.png'
            alt='Splibilo'
            className='h-8 w-8'
            width={32}
            height={32}
            priority
          />
          <Typography
            variant='h3'
            className='hidden font-semibold tracking-[-0.02em] sm:inline'
          >
            Splibilo
          </Typography>
        </Link>

        {/* Desktop nav */}
        <nav className='hidden items-center gap-1 lg:flex'>
          {mainNav.map((item) => {
            const active = isActive(item.url, item.exactMatch);
            return (
              <PrimaryLink
                key={item.title}
                href={item.url}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200',
                  active
                    ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/50 dark:text-primary-100'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {item.title}
              </PrimaryLink>
            );
          })}
        </nav>

        {/* Right side (desktop) */}
        <div className='hidden items-center gap-3 lg:flex'>
          <ThemeToggle />

          {isAuthed && user ? (
            <DesktopUserMenu user={user} />
          ) : (
            <div className='flex items-center gap-2'>
              <ButtonLink variant='outlineblack' href='/login'>
                Login
              </ButtonLink>
              <ButtonLink href='/register'>Register</ButtonLink>
            </div>
          )}
        </div>

        {/* Mobile: theme + menu button */}
        <div className='flex items-center gap-2 lg:hidden'>
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant='outlineblack' size='icon' className='lg:hidden'>
                <Menu className='h-5 w-5' />
                <span className='sr-only'>Toggle menu</span>
              </Button>
            </SheetTrigger>

            <SheetContent side='left' className='w-[300px] sm:w-[340px]'>
              {/* Wrap everything in a padded column */}
              <div className='flex h-full flex-col px-4 pt-4 pb-6'>
                {/* Accessible header for the sheet */}
                <SheetHeader className='mb-4 p-0'>
                  <SheetTitle className='sr-only'>Navigation</SheetTitle>

                  {/* Visible brand */}
                  <div className='flex items-center justify-between'>
                    <Link
                      href='/'
                      className='flex items-center gap-2'
                      onClick={() => setIsOpen(false)}
                    >
                      <NextImage
                        src='/images/logo/logo.png'
                        alt='Splibilo'
                        className='h-8 w-8'
                        width={32}
                        height={32}
                      />
                      <Typography variant='h5' className='font-bold'>
                        Splibilo
                      </Typography>
                    </Link>
                  </div>
                </SheetHeader>

                <Separator className='mb-4' />

                {/* Mobile nav items */}
                <ScrollArea className='h-[50vh] pr-2'>
                  <nav className='flex flex-col gap-3'>
                    {mainNav.map((item) => {
                      const active = isActive(item.url, item.exactMatch);
                      return (
                        <Link
                          key={item.title}
                          href={item.url}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'rounded-md px-3 py-2 text-base font-medium transition-colors duration-200',
                            active
                              ? 'bg-primary-50 text-primary-800 dark:bg-primary-900/50 dark:text-primary-100'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                          onClick={() => setIsOpen(false)}
                        >
                          {item.title}
                        </Link>
                      );
                    })}
                  </nav>
                </ScrollArea>

                <Separator className='my-4' />

                {/* Mobile user section (authed vs not authed) */}
                {isAuthed && user ? (
                  <div className='space-y-3'>
                    <div className='flex items-center gap-3 rounded-lg border bg-card p-3'>
                      <div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700'>
                        <span className='text-sm font-semibold'>
                          {getInitials(user)}
                        </span>
                      </div>
                      <div className='flex flex-col'>
                        <Typography variant='s2' className='font-medium'>
                          {user.name}
                        </Typography>
                        <Typography
                          variant='c1'
                          className='text-muted-foreground truncate max-w-[180px]'
                        >
                          {user.email}
                        </Typography>
                      </div>
                    </div>
                    <ButtonLink
                      href='/profile'
                      className='flex w-full items-center justify-center gap-2'
                      variant='outline'
                    >
                      <UserIcon className='h-4 w-4' />
                      <span>Profile</span>
                    </ButtonLink>
                    <Button
                      variant='destructive'
                      className='flex w-full items-center justify-center gap-2'
                      onClick={() => logoutMutation()}
                    >
                      <LogOut className='h-4 w-4' />
                      <span>Logout</span>
                    </Button>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    <ButtonLink
                      variant='outlineblack'
                      className='flex w-full'
                      href='/login'
                    >
                      Login
                    </ButtonLink>
                    <ButtonLink className='flex w-full' href='/register'>
                      Register
                    </ButtonLink>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
