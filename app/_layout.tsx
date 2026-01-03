import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { View, Image, Animated, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { useSocketStore } from '../src/store/socketStore';
import { useSidebarStore } from '../src/store/sidebarStore';
import { useThemeStore } from '../src/store/themeStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { testBackendConnection } from '../src/utils/backendTest';
import Sidebar from '../src/components/Sidebar';
import { useThemeColors } from '../src/utils/theme';
import { useUpdateCheck } from '../src/hooks/useUpdateCheck';

const { width } = Dimensions.get('window');

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
    // Test backend connection on app start
    testBackendConnection();

    // Load theme and settings
    loadTheme();
    loadSettings();

    // Check auth status (will restore persisted user if valid)
    checkAuthStatus();
    
    // Start pulse animation
    Animated.loop(
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
    ).start();

    // Simulate minimum loading time for better UX
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkAuthStatus, loadTheme, loadSettings]);

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
  }, [isCheckingAuth, isAppReady]);

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
});
