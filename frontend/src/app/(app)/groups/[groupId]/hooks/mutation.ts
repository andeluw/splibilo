import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import api from '@/lib/api';

import {
  CreateInviteRequest,
  RemoveMemberRequest,
} from '@/app/(app)/groups/[groupId]/types';

import type { ApiError, ApiResponse } from '@/types/api';

export function useArchiveGroupMutation(groupId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<
    AxiosResponse<ApiResponse<void>>,
    AxiosError<ApiError>,
    void
  >({
    mutationFn: async () => {
      const res = await api.patch(`/groups/${groupId}/archive`);
      return res;
    },
    onSuccess: (res) => {
      toast.success('Group archived successfully');

      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-detail', groupId] });

      router.push('/groups');
      return res.data.data;
    },
    onError: (error) => {
      toast.error(
        error.response?.data.message ||
          'Failed to archive group, please try again',
      );
    },
  });

  return { mutate, isPending };
}

export function useUnarchiveGroupMutation(groupId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<
    AxiosResponse<ApiResponse<void>>,
    AxiosError<ApiError>,
    void
  >({
    mutationFn: async () => {
      const res = await api.patch(`/groups/${groupId}/unarchive`);
      return res;
    },
    onSuccess: (res) => {
      toast.success('Group unarchived successfully');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-detail', groupId] });

      router.push('/groups');
      return res.data.data;
    },
    onError: (error) => {
      toast.error(
        error.response?.data.message ||
          'Failed to archive group, please try again',
      );
    },
  });

  return { mutate, isPending };
}

export function useLeaveGroupMutation(groupId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<
    AxiosResponse<ApiResponse<void>>,
    AxiosError<ApiError>,
    void
  >({
    mutationFn: async () => {
      const res = await api.post(`/groups/${groupId}/leave`);
      return res;
    },
    onSuccess: (res) => {
      toast.success('You have left the group');

      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group-detail', groupId] });

      router.push('/groups');
      return res.data.data;
    },
    onError: (error) => {
      toast.error(
        error.response?.data.message ||
          'Failed to leave group, please try again',
      );
    },
  });

  return { mutate, isPending };
}

export function useRemoveMemberMutation(groupId: string) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<
    AxiosResponse<ApiResponse<void>>,
    AxiosError<ApiError>,
    RemoveMemberRequest
  >({
    mutationFn: async ({ memberId }) => {
      const res = await api.delete(`/groups/${groupId}/members/${memberId}`);
      return res;
    },
    onSuccess: (res) => {
      toast.success('Member removed from group');

      // Refresh detail (members, balances, etc.)
      queryClient.invalidateQueries({ queryKey: ['group-detail', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-balances', groupId] });

      return res.data.data;
    },
    onError: (error) => {
      toast.error(
        error.response?.data.message ||
          'Failed to remove member, please try again',
      );
    },
  });

  return { mutate, isPending };
}

export function useCreateInviteMutation() {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<
    AxiosResponse<ApiResponse<void>>,
    AxiosError<ApiError>,
    CreateInviteRequest
  >({
    mutationFn: async ({ groupId, email }) => {
      return api.post(`/groups/${groupId}/invites`, { email });
    },
    onSuccess: () => {
      toast.success('Invite sent successfully');
      // you might invalidate something later if invites become visible
      queryClient.invalidateQueries({ queryKey: ['group-detail'] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data.message ||
          'Failed to send invite, please try again',
      );
    },
  });

  return { mutate, isPending };
}
