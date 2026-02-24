import { useMutation } from '@tanstack/react-query';
import { AxiosError, AxiosResponse } from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import api from '@/lib/api';
import { getRefreshToken } from '@/lib/cookie';

import useAuthStore from '@/store/useAuthStore';

import { ApiError } from '@/types/api';

export default function useLogoutMutation() {
  const router = useRouter();
  const refreshToken = getRefreshToken();

  const logout = useAuthStore.useLogout();

  const { mutate, isPending } = useMutation<
    AxiosResponse,
    AxiosError<ApiError>,
    void
  >({
    mutationFn: async () => {
      const res = await api.post('/auth/logout', {
        refresh_token: refreshToken,
      });

      return res;
    },
    onSuccess: () => {
      logout();

      router.push('/login');
      toast.success('Successfully logged out');
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
