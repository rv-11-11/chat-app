import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  const value = Constants.expoConfig?.extra?.[key];
  return value || defaultValue;
};

const SUPABASE_URL = getEnvVar('EXPO_PUBLIC_SUPABASE_URL', 'https://elcfjdfiiucahgmwtibh.supabase.co');
const SUPABASE_ANON_KEY = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsY2ZqZGZpaXVjYWhnbXd0aWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1MjMzMzYsImV4cCI6MjA4MzA5OTMzNn0.HIdfaqTfWoIxC0_f4b6Kecd9h1t6E9MnAdkj4MNtAPA');

// Choose storage adapter depending on environment: localStorage for web, SecureStore for native
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const localStorageAdapter = {
  async getItem(key: string) {
    try {
      return Promise.resolve(window.localStorage.getItem(key));
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    } catch {
      return null;
    }
  },
  async removeItem(key: string) {
    try {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    } catch {
      return null;
    }
  },
};

const secureStoreAdapter = {
  async getItem(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore
    }
  },
  async removeItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: 'supabase.auth.token',
    storage: (isWeb ? localStorageAdapter : secureStoreAdapter) as any,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Helper to open auth session for mobile using WebBrowser
export const openAuthSessionAsync = async (authUrl: string, redirectUri: string) => {
  try {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    return result;
  } catch (e) {
    throw e;
  }
};

// Initialize auth listener if needed
export const initSupabaseAuthListener = (onChange: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    onChange(event, session);
  });
};

// Helper for web: parse session from URL after OAuth redirect.
export const getSessionFromUrl = async () => {
  try {
    if (!isWeb) return null;

    // First try native supabase helper if available
    if ((supabase.auth as any).getSessionFromUrl) {
      try {
        console.log('[Supabase] attempting getSessionFromUrl');
        const res = await (supabase.auth as any).getSessionFromUrl({ storeSession: true });
        console.log('[Supabase] getSessionFromUrl result', res);
        return res;
      } catch (e) {
        console.log('[Supabase] getSessionFromUrl failed', e);
      }
    }

    // Fallback: parse hash fragment manually
    const hash = window.location.hash || '';
    if (!hash.startsWith('#')) return null;
    const params = new URLSearchParams(hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
  if (access_token) {
      // set session into supabase client storage
      try {
    console.log('[Supabase] setting session from hash', { access_token: !!access_token, refresh_token: !!refresh_token });
        const { data, error } = await (supabase.auth as any).setSession({
          access_token: access_token,
          refresh_token: (refresh_token || undefined) as any,
        });
    console.log('[Supabase] setSession result', { data, error });
        // clean the URL hash
        try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch {}
        return { data, error };
      } catch {
        return null;
      }
    }
    return null;
  } catch {
    return null;
  }
};
