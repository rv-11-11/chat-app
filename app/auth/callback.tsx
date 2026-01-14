import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Linking, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { getSessionFromUrl, supabase } from '../../src/services/supabase';
import * as Clipboard from 'expo-clipboard';
import { useThemeColors } from '../../src/utils/theme';

export default function AuthCallback() {
  const router = useRouter();
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incomingUrl, setIncomingUrl] = useState<string | null>(null);
  const [parsedTokens, setParsedTokens] = useState<{ access_token?: string | null; refresh_token?: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Web flow: try the helper which parses hash and sets session
        if (Platform.OS === 'web') {
          const res = await getSessionFromUrl();
          if (res && (res as any).data?.session) {
            router.replace('/(tab)');
            return;
          }
          setError('No session found in redirect URL.');
          return;
        }

  const incoming = await Linking.getInitialURL();
  const loggedIncoming = incoming ? incoming.split('#')[0] : incoming;
  console.log('[AuthCallback] incoming URL', loggedIncoming);
  setIncomingUrl(incoming || null);
        if (!incoming) {
          setError('No redirect URL received.');
          return;
        }

        // Extract fragment or query params
        let paramsString = '';
        try {
          const u = new URL(incoming);
          paramsString = u.hash || u.search || '';
  } catch {
          const hashIndex = incoming.indexOf('#');
          const qIndex = incoming.indexOf('?');
          if (hashIndex >= 0) paramsString = incoming.slice(hashIndex);
          else if (qIndex >= 0) paramsString = incoming.slice(qIndex);
        }

        if (!paramsString) {
          setError('Redirect URL contains no token fragment.');
          return;
        }

        const search = paramsString.startsWith('#') || paramsString.startsWith('?') ? paramsString.slice(1) : paramsString;
        const parsed = new URLSearchParams(search);
  const access_token = parsed.get('access_token');
  const refresh_token = parsed.get('refresh_token');
  setParsedTokens({ access_token, refresh_token });
        if (!access_token) {
          setError('No access_token found in redirect URL.');
          return;
        }

        try {
          console.log('[AuthCallback] setting native session from callback');
          await (supabase.auth as any).setSession({ access_token, refresh_token: (refresh_token || undefined) as any });
          router.replace('/(tab)');
          return;
        } catch (err: any) {
          console.log('[AuthCallback] setSession failed', err);
          setError('Failed to set session from redirect URL.');
          return;
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to parse auth redirect');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // Also listen for incoming URL events in case the app was already running
  useEffect(() => {
    const handleUrlEvent = async (event: { url: string }) => {
      try {
        const url = event.url;
        const loggedUrl = url ? url.split('#')[0] : url;
        console.log('[AuthCallback] url event', loggedUrl);
        setIncomingUrl(url || null);

        // parse fragment or query
        let paramsString = '';
        try {
          const u = new URL(url);
          paramsString = u.hash || u.search || '';
        } catch {
          const hashIndex = url.indexOf('#');
          const qIndex = url.indexOf('?');
          if (hashIndex >= 0) paramsString = url.slice(hashIndex);
          else if (qIndex >= 0) paramsString = url.slice(qIndex);
        }

        if (!paramsString) {
          setError('Redirect URL contains no token fragment.');
          return;
        }

        const search = paramsString.startsWith('#') || paramsString.startsWith('?') ? paramsString.slice(1) : paramsString;
        const parsed = new URLSearchParams(search);
        const access_token = parsed.get('access_token');
        const refresh_token = parsed.get('refresh_token');
        const code = parsed.get('code');

        if (code) {
            console.log('[AuthCallback] found PKCE code, exchanging for session');
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
                console.log('[AuthCallback] exchangeCodeForSession failed', error);
                setError('Failed to exchange code for session: ' + error.message);
                return;
            }
            if (data?.session) {
                console.log('[AuthCallback] session established from code');
                router.replace('/(tab)');
                return;
            }
        }

        setParsedTokens({ access_token, refresh_token });
        if (!access_token) {
          setError('No access_token or code found in redirect URL.');
          return;
        }

        await (supabase.auth as any).setSession({ access_token, refresh_token: (refresh_token || undefined) as any });
        router.replace('/(tab)');
      } catch (err) {
        console.log('[AuthCallback] url event handler failed', err);
      }
    };

    const subscription = Linking.addEventListener('url', handleUrlEvent as any);
    return () => subscription.remove();
  }, [router]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.message, { color: colors.foreground, marginTop: 12 }]}>Processing sign-in...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}> 
      <Text style={[styles.title, { color: colors.foreground }]}>Sign-in result</Text>
      {error ? <Text style={[styles.message, { color: colors.mutedForeground }]}>{error}</Text> : null}

      {incomingUrl ? (
        <View style={{ width: '100%', marginTop: 12 }}>
          <Text style={[styles.label, { color: colors.foreground }]}>Incoming redirect URL</Text>
          <Text selectable style={[styles.rawUrl, { color: colors.mutedForeground }]}>{incomingUrl}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity style={[styles.smallButton, { backgroundColor: colors.primary }]} onPress={async () => { await Clipboard.setStringAsync(incomingUrl); }}>
              <Text style={[styles.smallButtonText, { color: colors.primaryForeground }]}>Copy URL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallButton, { marginLeft: 8 }]} onPress={() => Linking.openURL(incomingUrl)}>
              <Text style={[styles.smallButtonText]}>Open URL</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {parsedTokens ? (
        <View style={{ width: '100%', marginTop: 12 }}>
          <Text style={[styles.label, { color: colors.foreground }]}>Parsed tokens</Text>
          <Text selectable style={[styles.rawUrl, { color: colors.mutedForeground }]}>access_token: {parsedTokens.access_token ?? '—'}</Text>
          <Text selectable style={[styles.rawUrl, { color: colors.mutedForeground }]}>refresh_token: {parsedTokens.refresh_token ?? '—'}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary, marginTop: 20 }]} onPress={() => router.replace('/(auth)/sign-in')}>
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Return to Sign In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  rawUrl: {
    fontSize: 12,
    backgroundColor: '#0f0f0f05',
    padding: 10,
    borderRadius: 8,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  smallButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },
});
