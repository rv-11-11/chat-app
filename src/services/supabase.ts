import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Choose storage adapter depending on environment: localStorage for web, SecureStore for native
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const localStorageAdapter = {
  async getItem(key: string) {
    try {
      return Promise.resolve(window.localStorage.getItem(key));
    } catch (e) {
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
      return Promise.resolve();
    } catch (e) {
      return null;
    }
  },
  async removeItem(key: string) {
    try {
      window.localStorage.removeItem(key);
      return Promise.resolve();
    } catch (e) {
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

    // On native, Expo's WebBrowser returns a url with tokens after OAuth flow.
    // Parse that url and set the Supabase session so the client has the proper credentials.
    try {
      if (result && (result as any).type === 'success' && (result as any).url) {
        const returnedUrl: string = (result as any).url;
        // Extract fragment (#...) or query (?...) params
        let paramsString = '';
        try {
          const u = new URL(returnedUrl);
          paramsString = u.hash || u.search || '';
        } catch (e) {
          // Fallback: try to split after '#' or '?'
          const hashIndex = returnedUrl.indexOf('#');
          const qIndex = returnedUrl.indexOf('?');
          if (hashIndex >= 0) paramsString = returnedUrl.slice(hashIndex);
          else if (qIndex >= 0) paramsString = returnedUrl.slice(qIndex);
        }

        if (paramsString.startsWith('#') || paramsString.startsWith('?')) {
          const search = paramsString.startsWith('#') ? paramsString.slice(1) : paramsString.slice(1);
          const parsed = new URLSearchParams(search);
          const access_token = parsed.get('access_token');
          const refresh_token = parsed.get('refresh_token');
          if (access_token) {
            // set session into supabase client storage
            try {
              console.log('[Supabase] native flow setSession from returned url');
              await (supabase.auth as any).setSession({
                access_token: access_token,
                refresh_token: (refresh_token || undefined) as any,
              });
            } catch (err) {
              console.log('[Supabase] native setSession failed', err);
              // show in-app alert on native so user can see failure during APK testing
              try {
                if (Platform.OS !== 'web') {
                  Alert.alert('Authentication Error', 'Failed to finish Google sign-in. Please try again or check redirect URI settings.');
                }
              } catch {}
            }
          }
        }
      }
    } catch {
      // ignore parsing errors
      console.log('[Supabase] openAuthSessionAsync parse error');
    }

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
