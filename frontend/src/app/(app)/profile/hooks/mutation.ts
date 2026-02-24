'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import logger from '@/lib/logger';
import { useGetUserDetail } from '@/hooks/query/useGetUserDetail';

import useAuthStore from '@/store/useAuthStore';

import type { UpdateMeRequest } from '@/app/(app)/profile/types';

import type { ApiError, ApiResponse } from '@/types/api';
import { User } from '@/types/entities/user';

export function useUpdateMeMutation() {
  const queryClient = useQueryClient();
  const login = useAuthStore.useLogin();

  const { refetch: refetchUserDetail } = useGetUserDetail({
    enabled: false,
  });

  return useMutation<
    AxiosResponse<ApiResponse<User>>,
    AxiosError<ApiError>,
    UpdateMeRequest
  >({
    mutationFn: async (payload: UpdateMeRequest) => {
      const res = await api.patch<ApiResponse<User>>('/me', payload);

      const user = await refetchUserDetail();
      const userData = user.data?.data;

      if (!userData) {
        throw new Error('User not found');
      }

      if (userData) login({ ...userData });
      return res;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
    onError: (error) => {
      logger(error, 'Failed to update profile');
      toast.error('Failed to update profile. Please try again.');
    },
  });
}
