import { useMutation } from '@tanstack/react-query';
import type { AxiosError, AxiosResponse } from 'axios';
import * as React from 'react';
import toast from 'react-hot-toast';

import api from '@/lib/api';

import {
  OcrReceiptData,
  OcrReceiptRequest,
} from '@/app/(app)/groups/[groupId]/expenses/form/ocr/types';

import type { ApiError, ApiResponse } from '@/types/api';

export function useOcrReceiptMutation() {
  const toastIdRef = React.useRef<string | number | undefined>(undefined);
  const { mutateAsync, isPending } = useMutation<
    AxiosResponse<ApiResponse<OcrReceiptData>>,
    AxiosError<ApiError>,
    OcrReceiptRequest
  >({
    mutationFn: async ({ path }) => {
      return api.post('/ocr/receipt', { path });
    },
    onMutate: () => {
      toastIdRef.current = toast.loading('Parsing receipt...');
    },
    onSuccess: () => {
      if (toastIdRef.current) {
        toast.success('Receipt parsed successfully', {
          id: toastIdRef.current.toString(),
        });
        toastIdRef.current = undefined;
      } else {
        toast.success('Receipt parsed successfully');
      }
    },
    onError: (error) => {
      const message =
        error.response?.data.message || 'Terjadi kesalahan, silahkan coba lagi';

      if (toastIdRef.current) {
        toast.error(message, { id: toastIdRef.current.toString() });
        toastIdRef.current = undefined;
      } else {
        toast.error(message);
      }
    },
    onSettled: () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current.toString());
        toastIdRef.current = undefined;
      }
    },
  });

  return { mutateAsync, isPending };
}
