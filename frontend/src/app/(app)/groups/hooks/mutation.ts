import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import api from '@/lib/api';

import {
  AcceptInviteRequest,
  JoinGroupRequest,
} from '@/app/(app)/groups/types';

import type { ApiError, ApiResponse } from '@/types/api';

export function useJoinGroupMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<
    AxiosResponse<ApiResponse<void>>,
    AxiosError<ApiError>,
    JoinGroupRequest
  >({
    mutationFn: async (data) => {
      return api.post('/groups/join', data);
    },
    onSuccess: () => {
      toast.success('Joined group successfully');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      router.push('/groups');
    },
    onError: (error) => {
      toast.error(
        error.response?.data.message ||
          'Failed to join group, please try again',
      );
    },
  });

  return { mutate, isPending };
}

export function useAcceptInviteMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<
    AxiosResponse<ApiResponse<void>>,
    AxiosError<ApiError>,
    AcceptInviteRequest
  >({
    mutationFn: async (data) => {
      return api.post('/invites/accept', data);
    },
    onSuccess: () => {
      toast.success('Invite accepted successfully');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      router.push('/groups');
    },
    onError: (error) => {
      toast.error(
        error.response?.data.message ||
          'Failed to accept invite, please try again',
      );
    },
  });

  return { mutate, isPending };
}
