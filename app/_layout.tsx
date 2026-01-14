import { useEffect, useState, useRef } from 'react';
import { Platform, View, Image, Animated, StyleSheet, Dimensions, TouchableOpacity, Text, Linking } from 'react-native';

// Load URL polyfill on native (non-web) runtimes only
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('react-native-url-polyfill/auto');
}
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { initSupabaseAuthListener } from '../src/services/supabase';
import { useSocketStore } from '../src/store/socketStore';
import { useSidebarStore } from '../src/store/sidebarStore';
import { useThemeStore } from '../src/store/themeStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { testBackendConnection, logBackendConfig } from '../src/utils/backendTest';
import Sidebar from '../src/components/Sidebar';
import { useThemeColors } from '../src/utils/theme';
import { useUpdateCheck } from '../src/hooks/useUpdateCheck';

  const { width } = Dimensions.get('window');

function TouchableDebug() {
  const openDebug = async () => {
    try {
      // Deep link to debug route
      const url = 'linkiplay://debug';
      // Use window.location for web, or Linking for native
      if (Platform.OS === 'web') {
        window.location.href = '/debug';
      } else {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Linking = require('react-native').Linking;
        Linking.openURL(url).catch(() => {});
      }
    } catch {}
  };

  return (
    <TouchableOpacity onPress={openDebug} style={styles.debugButton}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>DBG</Text>
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  const colors = useThemeColors();
  useUpdateCheck();
  const { checkAuthStatus, user, isCheckingAuth } = useAuthStore();
  const { connect, disconnect, isConnected } = useSocketStore();
  const { isOpen, closeSidebar } = useSidebarStore();
  const { loadTheme } = useThemeStore();
  const { loadSettings } = useSettingsStore();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    // Log backend configuration
    logBackendConfig();
    
    // Test backend connection on app start
    testBackendConnection();

    // Load theme and settings
    loadTheme();
    loadSettings();

    // Check auth status (will restore persisted user if valid)
    checkAuthStatus();

    // Initialize Supabase auth listener to keep global auth state in sync
    const subscription = initSupabaseAuthListener(async (event, session) => {
      console.log('[Supabase] auth event', event, !!session);
      if (session) {
        // Give native flows a brief moment for setSession to persist
        if (Platform.OS !== 'web') {
          await new Promise((r) => setTimeout(r, 800));
        }

        // Try to get the canonical user from Supabase client
        let supaUser = session.user as any;
        try {
          const { data: fetched } = await (await import('../src/services/supabase')).supabase.auth.getUser();
          if (fetched?.user) supaUser = fetched.user as any;
        } catch {
          console.log('[Supabase] getUser failed');
        }

        if (supaUser) {
          const meta = supaUser.user_metadata || {};
          const email = supaUser.email || meta.email || '';
          const name = meta.full_name || meta.name || '';
          const googleId = meta.sub || meta.provider_id || supaUser.id;
          const avatar = meta.avatar_url || meta.picture || meta.avatar || '';

          try {
            console.log('[Supabase] calling backend googleLogin', email, googleId);
            // Retry a few times in case backend cookie/token hasn't been set yet
            let attempts = 0;
            let lastRes: any = null;
            while (attempts < 3) {
              try {
                lastRes = await useAuthStore.getState().googleLogin({ email, name, googleId, avatar });
                console.log('[Backend] googleLogin response', lastRes);
                break;
              } catch {
                attempts += 1;
                console.log('[Backend] googleLogin attempt failed', attempts);
                await new Promise((r) => setTimeout(r, 500 * attempts));
              }
            }

            if (!lastRes) {
              // If still no backend token, sign out Supabase and clear local user to avoid partial UI
              console.log('[Auth] googleLogin failed after retries — signing out to avoid partial state');
              try { await (await import('../src/services/supabase')).supabase.auth.signOut(); } catch {}
              useAuthStore.getState().setUser(null);
            }
          } catch (e) {
            console.log('[Backend] unexpected error calling googleLogin', String(e));
          }
        }

      } else if (event === 'SIGNED_OUT') {
        useAuthStore.getState().setUser(null);
      }
    });

    return () => {
      // clean up listener
      try { (subscription as any)?.data?.subscription?.unsubscribe(); } catch { }
    };
  }, [checkAuthStatus, loadTheme, loadSettings]);

  // Animation and app ready timer separated to avoid unreachable code in previous effect
  useEffect(() => {
    // Start pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Simulate minimum loading time for better UX
    const timer = setTimeout(() => setIsAppReady(true), 2000);

    return () => {
      pulse.stop();
      clearTimeout(timer);
    };
  }, [scaleAnim]);

  useEffect(() => {
    // Connect socket if user is authenticated
    if (user && !isConnected) {
      connect();
    } else if (!user && isConnected) {
      // Disconnect socket if user logs out
      disconnect();
    }
  }, [user, isConnected, connect, disconnect]);

  useEffect(() => {
    if (!isCheckingAuth && isAppReady) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isCheckingAuth, isAppReady, fadeAnim]);

  // Show loading screen while checking auth or minimum wait time
  if (isCheckingAuth || !isAppReady) {
    return (
      <SafeAreaProvider>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
            <Image 
              source={require('../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(drawer)" />
          <Stack.Screen name="(tab)" />
          <Stack.Screen name="chat/[chatId]" />
          <Stack.Screen name="channel/[channelId]" />
          <Stack.Screen name="group/[groupId]" />
          <Stack.Screen name="community/[communityId]" />
        </Stack>
        {user && <Sidebar visible={isOpen} onClose={closeSidebar} />}
        {/* Floating debug button to open the in-app debug screen on device (dev only) */}
        {__DEV__ ? (
          <View style={styles.debugButtonContainer} pointerEvents="box-none">
            <TouchableDebug />
          </View>
        ) : null}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
  },
  debugButtonContainer: {
    position: 'absolute',
    right: 20,
    bottom: 40,
    zIndex: 9999,
  },
  debugButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
