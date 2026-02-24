import { useMutation } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { setRefreshToken, setToken } from '@/lib/cookie';
import { useGetUserDetail } from '@/hooks/query/useGetUserDetail';

import useAuthStore from '@/store/useAuthStore';

import { LoginForm, LoginResponse } from '@/app/(auth)/login/types';

import { ApiError, ApiResponse } from '@/types/api';

export default function useLoginMutation() {
  const router = useRouter();
  const login = useAuthStore.useLogin();

  const { refetch: refetchUserDetail } = useGetUserDetail({
    enabled: false,
  });

  const { mutate, isPending } = useMutation<
    AxiosResponse,
    AxiosError<ApiError>,
    LoginForm
  >({
    mutationFn: async (data: LoginForm) => {
      const res = await api.post<ApiResponse<LoginResponse>>(
        '/auth/login',
        data,
      );
      const { access_token, refresh_token } = res.data.data;
      setToken(access_token);
      setRefreshToken(refresh_token);

      const user = await refetchUserDetail();
      const userData = user.data?.data;

      if (!userData) {
        throw new Error('User not found');
      }

      if (userData) login({ ...userData });

      return res;
    },
    onSuccess: () => {
      // router.push('/');
      toast.success('Login sucessful');
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
