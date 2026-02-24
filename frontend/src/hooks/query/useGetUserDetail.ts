import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import api from '@/lib/api';

import { ApiError, ApiResponse } from '@/types/api';
import { User } from '@/types/entities/user';

export function useGetUserDetail({ enabled }: { enabled?: boolean }) {
  const result = useQuery<ApiResponse<User>, AxiosError<ApiError>>({
    queryKey: ['user-detail'],
    queryFn: async () => {
      const response = await api.get('/me');
      return response.data;
    },
    enabled,
  });

  return result;
}
