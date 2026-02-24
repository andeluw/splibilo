import { useMutation } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import api from '@/lib/api';

import {
  RegisterRequest,
  RegisterResponse,
} from '@/app/(auth)/register/types';

import { ApiError, ApiResponse } from '@/types/api';

export default function useRegisterMutation() {
  const router = useRouter();

  const { mutate, isPending } = useMutation<
    AxiosResponse<ApiResponse<RegisterResponse>>,
    AxiosError<ApiError>,
    RegisterRequest
  >({
    mutationFn: async (data: RegisterRequest) => {
      const res = await api.post<ApiResponse<RegisterResponse>>(
        '/auth/register',
        data,
      );
      return res;
    },
    onSuccess: () => {
      router.push('/login');
      toast.success('Registration successful, please login');
    },
    onError: (error) => {
      toast.error(error.response?.data.message || 'Something went wrong, please try again');
    }
  });
  return { mutate, isPending };
}
