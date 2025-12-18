import { create } from 'zustand';
import { authApi } from '../services/api/auth';
import { channelApi } from '../services/api/channel';
import { chatApi } from '../services/api/chat';
import { connectSocket, disconnectSocket } from '../services/socket/socketClient';
import { secureStorage } from '../services/storage/secureStore';
import type { LoginData, RegisterData, User } from '../types/auth.types';

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
      // Persist token if backend returned one
      if ((response as any).token) {
        await secureStorage.set('authToken', (response as any).token).catch(() => {});
      }
      // connect socket after successful auth
      try { connectSocket(); } catch (e) {}
      // process any pending invite stored before auth
      try { await processPendingInvite(); } catch (e) {}
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
      if ((response as any).token) {
        await secureStorage.set('authToken', (response as any).token).catch(() => {});
      }
      try { connectSocket(); } catch (e) {}
      try { await processPendingInvite(); } catch (e) {}
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
      await secureStorage.remove('authToken').catch(() => {});
      try { disconnectSocket(); } catch (e) {}
    } catch (error: any) {
      throw error;
    }
  },

  checkAuthStatus: async () => {
    set({ isCheckingAuth: true });
    try {
      const response = await authApi.getStatus();
      set({ user: response.user });
      // if backend provided token, persist it
      if ((response as any).token) {
        await secureStorage.set('authToken', (response as any).token).catch(() => {});
      }
      try { connectSocket(); } catch (e) {}
      try { await processPendingInvite(); } catch (e) {}
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

// Process pending invite saved before authentication (web fallback behavior)
const processPendingInvite = async () => {
  try {
    const pending = await secureStorage.get('pendingInvite');
    if (!pending) return;
    let obj: { type: 'group' | 'channel' | 'community'; id: string } | null = null;
    try { obj = JSON.parse(pending); } catch { obj = null; }
    if (!obj) {
      await secureStorage.remove('pendingInvite');
      return;
    }

    if (obj.type === 'group') {
      try {
        await chatApi.addMember(obj.id, useAuthStore.getState().user?._id || '');
        await secureStorage.remove('pendingInvite');
        return;
      } catch (err: any) {
        if (err?.response?.status === 401) {
          // server might not have set session cookie yet; try a retry after delay
          await new Promise((r) => setTimeout(r, 500));
          try { await chatApi.addMember(obj.id, useAuthStore.getState().user?._id || ''); await secureStorage.remove('pendingInvite'); return; } catch { /* ignore */ }
        }
      }
    } else if (obj.type === 'channel') {
      try {
        await channelApi.subscribe(obj.id);
        await secureStorage.remove('pendingInvite');
        return;
      } catch (err: any) {
        if (err?.response?.status === 401) {
          await new Promise((r) => setTimeout(r, 500));
          try { await channelApi.subscribe(obj.id); await secureStorage.remove('pendingInvite'); return; } catch { /* ignore */ }
        }
      }
    }
    // community invite handling can be added here when API client exists
  } catch (e) {
    // ignore
  }
};

