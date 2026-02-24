import toast from 'react-hot-toast';

import { CURRENCY, LOCALE } from '@/constant/common';

export function getFromLocalStorage(key: string): string | null {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(key);
  }
  return null;
}

export function getFromSessionStorage(key: string): string | null {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(key);
  }
  return null;
}

export type ExtractProps<T> = T extends React.ComponentType<infer P> ? P : T;
export type Merge<P, T> = Omit<P, keyof T> & T;
export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

/**
 * Get deep keyof from a nested object
 * @see https://stackoverflow.com/questions/58434389/typescript-deep-keyof-of-a-nested-object
 */
export type Paths<T, D extends number = 10> = [D] extends [never]
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? `${K}` | (Paths<T[K], Prev[D]> extends infer R ? Join<K, R> : never)
          : never;
      }[keyof T]
    : '';

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never
  : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, ...0[]];

export function numberToCurrency(
  number: number,
  options: Intl.NumberFormatOptions & { trailingZeroDisplay?: string } = {},
  withCurrency: boolean = true,
  locale: string = LOCALE,
  /** Display currency if true, default true */
) {
  return new Intl.NumberFormat(locale, {
    trailingZeroDisplay: 'stripIfInteger',
    ...(withCurrency && { style: 'currency', currency: CURRENCY }),
    ...options,
  }).format(number);
}


export function copyToClipboardWithToast(
  text: string,
  {
    successMessage = 'Link copied to clipboard',
    errorMessage = 'Failed to copy link',
  }: { successMessage?: string; errorMessage?: string } = {},
) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    toast.error(errorMessage);
    return;
  }

  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success(successMessage);
    })
    .catch(() => {
      toast.error(errorMessage);
    });
}
