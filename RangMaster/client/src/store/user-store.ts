import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  id: string | null;
  username: string | null;
  isAuthenticated: boolean;
  setUser: (id: string, username: string) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      id: null,
      username: null,
      isAuthenticated: false,
      
      setUser: (id: string, username: string) => {
        set({ id, username, isAuthenticated: true });
      },
      
      clearUser: () => {
        set({ id: null, username: null, isAuthenticated: false });
      },
    }),
    {
      name: 'rang-user-storage',
    }
  )
);
