import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import { useThemeColors } from '../src/utils/theme';

export default function Index() {
  const { user, isCheckingAuth } = useAuthStore();
  const colors = useThemeColors();

  if (isCheckingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tab)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
