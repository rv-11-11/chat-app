import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { useSocketStore } from '../src/store/socketStore';
import { useSidebarStore } from '../src/store/sidebarStore';
import { useThemeStore } from '../src/store/themeStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { testBackendConnection } from '../src/utils/backendTest';
import Sidebar from '../src/components/Sidebar';
import { useThemeColors } from '../src/utils/theme';

export default function RootLayout() {
  const colors = useThemeColors();
  const { checkAuthStatus, user, isCheckingAuth } = useAuthStore();
  const { connect, disconnect, isConnected } = useSocketStore();
  const { isOpen, closeSidebar } = useSidebarStore();
  const { loadTheme } = useThemeStore();
  const { loadSettings } = useSettingsStore();

  useEffect(() => {
    // Test backend connection on app start
    testBackendConnection();

    // Load theme and settings
    loadTheme();
    loadSettings();

    // Check auth status (will restore persisted user if valid)
    checkAuthStatus();
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

  // Show loading screen while checking auth
  if (isCheckingAuth) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
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
