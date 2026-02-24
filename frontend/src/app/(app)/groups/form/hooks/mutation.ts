import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import api from '@/lib/api';

import { CreateGroupRequest } from '@/app/(app)/groups/form/types';

import { ApiError, ApiResponse } from '@/types/api';

export function useCreateGroupMutation() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation<
    AxiosResponse<ApiResponse<void>>,
    AxiosError<ApiError>,
    CreateGroupRequest
  >({
    mutationFn: async (data: CreateGroupRequest) => {
      const res = await api.post('/groups', data);
      return res;
    },
    onSuccess: (res) => {
      toast.success('Group created successfully');

      queryClient.invalidateQueries({ queryKey: ['groups'] });

      router.push('/groups');
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
