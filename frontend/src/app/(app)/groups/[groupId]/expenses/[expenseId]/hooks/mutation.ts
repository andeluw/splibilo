import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import api from '@/lib/api';

import { UpdateExpenseRequest } from '@/app/(app)/groups/[groupId]/expenses/[expenseId]/types';

import { ApiError, ApiResponse } from '@/types/api';

type UpdateExpenseMutationProps = {
  groupId: string;
  expenseId: string;
};

export function useUpdateExpenseMutation({
  groupId,
  expenseId,
}: UpdateExpenseMutationProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation<
    AxiosResponse<ApiResponse<void>>,
    AxiosError<ApiError>,
    UpdateExpenseRequest
  >({
    mutationFn: async (data: UpdateExpenseRequest) => {
      const res = await api.patch(
        `/groups/${groupId}/expenses/${expenseId}`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Expense updated successfully');

      queryClient.invalidateQueries({
        queryKey: ['expense-detail', groupId, expenseId],
      });
      queryClient.invalidateQueries({
        queryKey: ['group-expenses', groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['group-detail', groupId],
      });

      router.push(`/groups/${groupId}?tab=expenses`);
    },
    onError: () => {
      toast.error('Failed to update expense');
    },
  });
}
