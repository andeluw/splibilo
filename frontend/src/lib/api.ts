import axios, { AxiosError } from 'axios';
import type { GetServerSidePropsContext } from 'next/types';
import Cookies from 'universal-cookie';

import {
  getRefreshToken,
  getToken,
  removeRefreshToken,
  removeToken,
  setRefreshToken,
  setToken,
} from '@/lib/cookie';

import type { LoginResponse } from '@/app/(auth)/login/types';

import type { ApiResponse, UninterceptedApiError } from '@/types/api';

let context: GetServerSidePropsContext | null = null;
export function setApiContext(ctx: GetServerSidePropsContext): void {
  context = ctx;
}

export const baseURL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

api.defaults.withCredentials = false;
const isBrowser = typeof window !== 'undefined';

api.interceptors.request.use((config) => {
  if (config.headers) {
    let token: string | undefined;

    if (!isBrowser) {
      if (!context) {
        throw new Error(
          'Api Context not found. You must call setApiContext(ctx) before calling api on server-side',
        );
      }

      const cookies = new Cookies(context.req?.headers.cookie);
      // SSR cookie name for Splibilo
      token = cookies.get('token_splibilo');
    } else {
      token = getToken();
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers.Authorization) {
      delete (config.headers as Record<string, unknown>).Authorization;
    }
  }

  return config;
});

api.interceptors.response.use(
  (config) => config,
  async (error: AxiosError<UninterceptedApiError>) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    const requestUrl = originalRequest?.url || '';
    const isAuthRoute = [
      '/auth/refresh',
      '/auth/login',
      '/auth/register',
    ].includes(requestUrl);

    const shouldAttemptRefresh =
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthRoute;

    if (shouldAttemptRefresh) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await getOrCreateRefreshPromise();

        originalRequest.headers = originalRequest.headers ?? {};

        if (newAccessToken) {
          (originalRequest.headers as Record<string, string>).Authorization =
            `Bearer ${newAccessToken}`;
        } else if (originalRequest.headers.Authorization) {
          delete (originalRequest.headers as Record<string, unknown>)
            .Authorization;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed → clear tokens and bubble a friendly error up
        removeToken();
        removeRefreshToken();

        return Promise.reject({
          ...(refreshError as AxiosError),
          response: {
            ...(refreshError as AxiosError).response,
            data: {
              error: 'You do not have access to this page, please login again.',
            },
          },
        });
      }
    }

    // normalize message field like before
    if (error.response?.data.message) {
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: {
            ...error.response.data,
            message:
              typeof error.response.data.message === 'string'
                ? error.response.data.message
                : // first validation error message if backend returns object of arrays
                  (Object.values(error.response.data.message)[0]?.[0] ??
                  'Something went wrong'),
          },
        },
      });
    }

    return Promise.reject(error);
  },
);

export default api;

// ----------------- refresh helpers -----------------

let refreshPromise: Promise<string | undefined> | null = null;

async function getOrCreateRefreshPromise(): Promise<string | undefined> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function refreshAccessToken(): Promise<string | undefined> {
  const plain = axios.create({
    baseURL,
    withCredentials: false,
    headers: { 'Content-Type': 'application/json' },
  });

  let rToken: string | undefined;

  if (!isBrowser) {
    if (!context) {
      throw new Error(
        'Api Context not found. You must call setApiContext(ctx) before calling api on server-side',
      );
    }
    const cookies = new Cookies(context.req?.headers.cookie);
    // SSR refresh cookie for Splibilo
    rToken = cookies.get('refresh_token_splibilo');
  } else {
    rToken = getRefreshToken();
  }

  if (!rToken) {
    throw new Error('No refresh token');
  }

  const response = await plain.post<ApiResponse<LoginResponse>>(
    '/auth/refresh',
    { refresh_token: rToken },
  );

  const { access_token, refresh_token } = response.data.data;

  setToken(access_token);
  setRefreshToken(refresh_token);

  return access_token;
}
