import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import api from '@/lib/api';

import { CreateSettlementRequest } from '@/app/(app)/groups/[groupId]/settlements/form/types';

import type { ApiError, ApiResponse } from '@/types/api';

type UseCreateSettlementMutationProps = {
  groupId: string;
};

export function useCreateSettlementMutation({
  groupId,
}: UseCreateSettlementMutationProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<
    AxiosResponse<ApiResponse<void>>,
    AxiosError<ApiError>,
    CreateSettlementRequest
  >({
    mutationFn: async (data: CreateSettlementRequest) => {
      const res = await api.post(`/groups/${groupId}/settlements`, data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Settlement created successfully.');

      queryClient.invalidateQueries({
        queryKey: ['group-settlements', groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['group-summary', groupId],
      });

      router.push(`/groups/${groupId}?tab=settlements`);
    },
    onError: () => {
      toast.error('Failed to create settlement.');
    },
  });
}
