import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import api from '@/lib/api';

import type { CreateExpenseRequest } from '../types';

import type { ApiError, ApiResponse } from '@/types/api';

type CreateExpenseMutationProps = {
  groupId: string;
};

export function useCreateExpenseMutation({
  groupId,
}: CreateExpenseMutationProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<
    AxiosResponse<ApiResponse<void>>,
    AxiosError<ApiError>,
    CreateExpenseRequest
  >({
    mutationFn: async (data: CreateExpenseRequest) => {
      const res = await api.post(`/groups/${groupId}/expenses`, data);
      return res;
    },
    onSuccess: (res) => {
      toast.success('Expense added successfully');

      queryClient.invalidateQueries({ queryKey: ['group-detail', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-balances', groupId] });

      router.push(`/groups/${groupId}?tab=expenses`);
      return res.data.data;
    },
    onError: (error) => {
      toast.error(
        error.response?.data.message ||
          'Something went wrong, please try again',
      );
    },
  });

  return { mutate, isPending };
}
