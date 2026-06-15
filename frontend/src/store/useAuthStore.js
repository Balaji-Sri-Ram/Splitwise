import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { io } from 'socket.io-client';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      socket: null,
      initSocket: (userId) => {
        const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
        socket.emit('join_user', userId);
        set({ socket });
      },
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        set((state) => {
          if (state.socket) state.socket.disconnect();
          return { user: null, token: null, isAuthenticated: false, socket: null };
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => {
        const { socket, ...rest } = state;
        return rest;
      },
    }
  )
);
