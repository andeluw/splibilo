'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { getToken, removeToken } from '@/lib/cookie';
import { useGetUserDetail } from '@/hooks/query/useGetUserDetail';

import Loading from '@/components/loading';

import useAuthStore from '@/store/useAuthStore';

import { User } from '@/types/entities/user';

const ROLE = ['ADMIN', 'USER'] as const;

type Role = (typeof ROLE)[number];

export interface WithAuthProps {
  user: User;
}

const USER_ROUTE = '/';
const ADMIN_ROUTE = '/admin';
const LOGIN_ROUTE = '/login';

export enum RouteRole {
  /**
   Dapat diakses hanya ketika user belum login (Umum)
   */
  public,
  /**
   * Dapat diakses semuanya
   */
  optional,
  /**
   * For all authenticated user
   * will push to login if user is not authenticated
   */
  user,
  /**
   * For all authenticated admin
   * will push to login if user is not authenticated
   */
  admin,
}

export const isRole = (p: Role): p is Role => ROLE.includes(p as Role);

/**
 * Add role-based access control to a component
 *
 * @see https://react-typescript-cheatsheet.netlify.app/docs/hoc/full_example/
 * @see https://github.com/mxthevs/nextjs-auth/blob/main/src/components/withAuth.tsx
 */
export default function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  routeRole: keyof typeof RouteRole,
) {
  function ComponentWithAuth(props: T) {
    const router = useRouter();
    const params = useSearchParams();
    const redirect = params?.get('redirect');
    const pathName = usePathname();

    //#region //*=========== Hooks ===========
    const { refetch: refetchUserDetail } = useGetUserDetail({ enabled: false });
    //#endregion  //*======== Hooks ===========

    //#region  //*=========== STORE ===========
    const isAuthenticated = useAuthStore.useIsAuthed();
    const isLoading = useAuthStore.useIsLoading();
    const login = useAuthStore.useLogin();
    const logout = useAuthStore.useLogout();
    const stopLoading = useAuthStore.useStopLoading();
    const user = useAuthStore.useUser();
    //#endregion  //*======== STORE ===========

    const checkAuth = React.useCallback(() => {
      const token = getToken();
      if (!token) {
        isAuthenticated && logout();
        stopLoading();
        return;
      }
      const loadUser = async () => {
        try {
          const res = await refetchUserDetail();
          const user = res.data?.data;
          if (!user) {
            logout();
            return;
          }
          login({
            id: user.id,
            email: user.email,
            name: user.name,
            avatar_url: user.avatar_url,
            role: user.role,
            is_suspended: user.is_suspended,
            email_on_settlement_received: user.email_on_settlement_received,
          });
        } catch (_err) {
          await removeToken();
        } finally {
          stopLoading();
        }
      };

      loadUser();
    }, [isAuthenticated, login, logout, stopLoading]);

    React.useEffect(() => {
      checkAuth();

      window.addEventListener('focus', checkAuth);
      return () => {
        window.removeEventListener('focus', checkAuth);
      };
    }, [checkAuth]);

    React.useEffect(() => {
      const Redirect = () => {
        if (isAuthenticated) {
          if (routeRole === 'public') {
            if (redirect) {
              router.replace(redirect as string);
            } else if (user?.role === 'ADMIN') {
              router.replace(ADMIN_ROUTE);
            } else {
              router.replace(USER_ROUTE);
            }
          }
          if (user?.role === 'USER') {
            if (routeRole === 'admin') {
              router.replace(USER_ROUTE);
            }
          }
        } else if (routeRole !== 'public') {
          router.replace(`${LOGIN_ROUTE}?redirect=${pathName}`);
        }
      };

      if (!isLoading) {
        Redirect();
      }
    }, [isAuthenticated, isLoading, pathName, redirect, router, user]);

    if (
      (isLoading || !isAuthenticated) &&
      routeRole !== 'public' &&
      routeRole !== 'optional'
    ) {
      return <Loading />;
    }

    return <Component {...(props as T)} user={user} />;
  }

  // useSearchParams opts the tree into client-side rendering, which Next
  // refuses to prerender without a boundary above it.
  function ComponentWithAuthBoundary(props: T) {
    return (
      <React.Suspense fallback={<Loading />}>
        <ComponentWithAuth {...props} />
      </React.Suspense>
    );
  }

  return ComponentWithAuthBoundary;
}
