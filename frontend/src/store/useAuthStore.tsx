import { createSelectorHooks } from 'auto-zustand-selectors-hook';
import { produce } from 'immer';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { removeRefreshToken, removeToken } from '@/lib/cookie';

import { User } from '@/types/entities/user';

type AuthStoreType = {
  user: User | null;
  isAuthed: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  stopLoading: () => void;
};

const useAuthStoreBase = create<AuthStoreType>()(
  persist(
    (set) => ({
      user: null,
      isAuthed: false,
      isLoading: true,
      login: (user) => {
        set(
          produce<AuthStoreType>((state) => {
            state.isAuthed = true;
            state.user = user;
          }),
        );
      },
      logout: () => {
        removeToken();
        removeRefreshToken();
        set(
          produce<AuthStoreType>((state) => {
            state.isAuthed = false;
            state.user = null;
          }),
        );
      },
      stopLoading: () => {
        set(
          produce<AuthStoreType>((state) => {
            state.isLoading = false;
          }),
        );
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthed: state.isAuthed,
      }),
    },
  ),
);

const useAuthStore = createSelectorHooks(useAuthStoreBase);

export default useAuthStore;
