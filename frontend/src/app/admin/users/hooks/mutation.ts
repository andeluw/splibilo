import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

import api from '@/lib/api';

import { ApiError } from '@/types/api';

type UserSuspensionRequest = {
  id: string;
  is_suspended: boolean;
};

export function useUserSuspensionMutation() {
  const queryClient = useQueryClient();

  const { mutate, isPending, ...rest } = useMutation<
    void,
    AxiosError<ApiError>,
    UserSuspensionRequest
  >({
    mutationFn: async ({ id, is_suspended }: UserSuspensionRequest) => {
      const res = await api.patch(`/admin/users/${id}`, { is_suspended });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.is_suspended
          ? 'User suspended successfully'
          : 'User unsuspended successfully',
      );

      queryClient.invalidateQueries({
        queryKey: ['admin-users'],
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
