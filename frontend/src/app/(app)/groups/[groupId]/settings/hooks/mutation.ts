import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import api from '@/lib/api';

import type { UpdateGroupRequest } from '../types';

import type { ApiResponse } from '@/types/api';

type UseUpdateGroupMutationOptions = {
  groupId: string;
};

export function useUpdateGroupMutation({
  groupId,
}: UseUpdateGroupMutationOptions) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (payload: UpdateGroupRequest) => {
      const res = await api.patch<ApiResponse<unknown>>(
        `/groups/${groupId}`,
        payload,
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Group updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['group-detail', groupId] });

      router.push(`/groups/${groupId}?tab=settings`);
    },
    onError: () => {
      toast.error('Failed to update group. Please try again.');
    },
  });
}
