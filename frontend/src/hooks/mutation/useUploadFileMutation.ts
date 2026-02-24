import { useMutation } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

import api from '@/lib/api';

import { ApiError, ApiResponse } from '@/types/api';
import type { File } from '@/types/dropzone';

type UploadKind = 'avatar' | 'receipt' | 'proof' | 'icon';

type UploadResponseData = {
  file_url: string;
  path: string;
  kind: UploadKind;
};

export function useUploadFileMutation(kind: UploadKind) {
  const { mutate, isPending, ...rest } = useMutation<
    AxiosResponse<ApiResponse<UploadResponseData>>,
    AxiosError<ApiError>,
    { file: File }
  >({
    mutationFn: async ({ file }: { file: File }) => {
      const formData = new FormData();

      if (typeof file === 'string') {
        const resp = await fetch(file);
        const blob = await resp.blob();
        const fallbackName = file.split('/').pop() || 'upload';
        const nativeFile = new window.File([blob], fallbackName, {
          type: blob.type || 'application/octet-stream',
        });

        formData.append('file', nativeFile);
      } else if (Array.isArray(file)) {
        const first = file[0];
        if (!first) {
          throw new Error('Invalid file input');
        }

        if (first instanceof File) {
          formData.append('file', first);
        } else if ('file' in first && first.file instanceof File) {
          formData.append('file', first.file);
        } else {
          throw new Error('Invalid file input');
        }
      } else {
        throw new Error('Invalid file input');
      }

      const res = await api.post(`/upload/${kind}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return res;
    },
    onSuccess: () => {
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      toast.error(
        error.response?.data.message ||
          'Something went wrong, please try again',
      );
    },
  });

  return { mutate, isPending, ...rest };
}
