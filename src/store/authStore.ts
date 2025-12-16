import { create } from 'zustand';
import { authApi } from '../services/api/auth';
import type { User, RegisterData, LoginData } from '../types/auth.types';

interface AuthState {
  user: User | null;
  isLoggingIn: boolean;
  isSigningUp: boolean;
  isCheckingAuth: boolean;

  // Actions
  register: (data: RegisterData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggingIn: false,
  isSigningUp: false,
  isCheckingAuth: false,

  register: async (data: RegisterData) => {
    set({ isSigningUp: true });
    try {
      const response = await authApi.register(data);
      set({ user: response.user });
      // Socket will be connected via useEffect in root layout
    } catch (error: any) {
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data: LoginData) => {
    set({ isLoggingIn: true });
    try {
      const response = await authApi.login(data);
      set({ user: response.user });
      // Socket will be connected via useEffect in root layout
    } catch (error: any) {
      throw error;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
      set({ user: null });
      const { disconnectSocket } = await import('../services/socket/socketClient');
      disconnectSocket();
    } catch (error: any) {
      throw error;
    }
  },

  checkAuthStatus: async () => {
    set({ isCheckingAuth: true });
    try {
      const response = await authApi.getStatus();
      set({ user: response.user });
      // Socket will be connected via useEffect in root layout
    } catch (error) {
      set({ user: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  setUser: (user: User | null) => {
    set({ user });
  },
}));

