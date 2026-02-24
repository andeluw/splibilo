import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import api from '@/lib/api';

import { ApiError } from '@/types/api';

type DeleteReceiptRequest = {
  id: string;
};

export function useDeleteReceiptMutation() {
  const queryClient = useQueryClient();

  const { mutate, isPending, ...rest } = useMutation<
    void,
    AxiosError<ApiError>,
    DeleteReceiptRequest
  >({
    mutationFn: async ({ id }: DeleteReceiptRequest) => {
      const res = await api.delete(`/admin/expenses/${id}/receipt`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Receipt deleted successfully');

      queryClient.invalidateQueries({
        queryKey: ['admin-expenses'],
      });
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
