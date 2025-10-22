import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      customer: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (customer, accessToken, refreshToken) => 
        set({ customer, accessToken, refreshToken }),
      logout: () => set({ customer: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

