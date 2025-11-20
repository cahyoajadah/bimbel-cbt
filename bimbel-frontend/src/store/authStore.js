// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => {
        set({ 
          user, 
          token, 
          isAuthenticated: true 
        });
      },
      
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
      },
      
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        });
        sessionStorage.removeItem('cbt_session_token');
      },
      
      getRole: () => {
        return get().user?.role;
      },
      
      isAdmin: () => {
        return get().user?.role === 'admin_manajemen';
      },
      
      isQuestionMaker: () => {
        return get().user?.role === 'pembuat_soal';
      },
      
      isStudent: () => {
        return get().user?.role === 'siswa';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
