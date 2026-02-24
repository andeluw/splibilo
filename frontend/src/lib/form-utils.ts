import get from 'lodash.get';
import { lookup } from 'mime-types';

import { Paths } from '@/lib/helper';

export const convertUrlToFileWithPreview = ({
  url,
  fileName,
}: {
  url: string | undefined;
  fileName: string;
}) =>
  url && [
    {
      preview: url,
      name: fileName,
      type: lookup(url) || 'image/jpeg',
    },
  ];

/**
* Validation for exact length
* @param length exact string length
* @param message error message
* @returns React Hook Form's validation object
*/
export function exactLength(length: number, message: string) {
  return {
    minLength: {
      value: length,
      message,
    },
    maxLength: {
      value: length,
      message,
    },
  };
}

export function isSelectionChanged<T>(
  key: Paths<T>,
  {
    touchedFields,
    dirtyFields,
  }: {
    touchedFields: Partial<T>;
    dirtyFields: Partial<T>;
  },
) {
  return get(touchedFields, key) || get(dirtyFields, key);
}
