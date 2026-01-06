import { useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, SafeAreaView, Animated, Easing } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeColors } from '../../src/utils/theme';
import type { LoginData } from '../../src/types/auth.types';
import { Ionicons } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase, openAuthSessionAsync, getSessionFromUrl } from '../../src/services/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoggingIn } = useAuthStore();
  const router = useRouter();
  const colors = useThemeColors();

  // Pulse animation for logo
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // If redirected back to web after Supabase OAuth, try to extract and persist session
  useEffect(() => {
    (async () => {
      try {
        const res = await getSessionFromUrl();
        if (res && (res as any).data?.session) {
          router.replace('/(tab)');
        }
      } catch {
        // ignore
      }
    })();
  }, [router]);

  // Use Supabase's callback URL for OAuth provider, then redirect to app
  const redirectUri = makeRedirectUri({ scheme: 'linkiplay', path: 'auth/callback' });

  const handleGoogle = async () => {
    try {
      // Initiate Supabase OAuth flow. This will open a browser session.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          // WebBrowser will handle the session; supabase client is configured to not detect session in url
        },
      });

      if (error) {
        Alert.alert('Sign in failed', error.message || 'Google sign in encountered an error');
        return;
      }

      // data will include url to open for the OAuth flow on some platforms
      if ((data as any)?.url) {
        const result = await openAuthSessionAsync((data as any).url, redirectUri);
        
        // Check if the auth session completed successfully
        if (result.type === 'success' && result.url) {
          try {
            // Parse the URL to extract tokens
            // The URL might be in format: linkiplay://#access_token=...&refresh_token=...
            let accessToken: string | null = null;
            let refreshToken: string | null = null;
            
            // Try to parse as URL (works for http/https URLs)
            try {
              const url = new URL(result.url);
              accessToken = url.searchParams.get('access_token') || url.hash.match(/access_token=([^&]+)/)?.[1] || null;
              refreshToken = url.searchParams.get('refresh_token') || url.hash.match(/refresh_token=([^&]+)/)?.[1] || null;
            } catch {
              // If URL parsing fails (e.g., custom scheme), parse manually
              const hashMatch = result.url.match(/#(.+)/);
              if (hashMatch) {
                const params = new URLSearchParams(hashMatch[1]);
                accessToken = params.get('access_token');
                refreshToken = params.get('refresh_token');
              } else {
                // Try to extract from the full URL string
                const accessMatch = result.url.match(/access_token=([^&]+)/);
                const refreshMatch = result.url.match(/refresh_token=([^&]+)/);
                accessToken = accessMatch ? accessMatch[1] : null;
                refreshToken = refreshMatch ? refreshMatch[1] : null;
              }
            }
            
            if (accessToken) {
              // Set the session manually
              try {
                await (supabase.auth as any).setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || undefined,
                });
              } catch (sessionError) {
                console.log('[Supabase] Error setting session from redirect:', sessionError);
              }
            }
            
            // Wait a moment for the session to be processed
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if we have a session now
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              // Navigation will happen via the auth state listener in root layout
              router.replace('/(tab)');
            }
          } catch (parseError) {
            console.log('[OAuth] Error parsing redirect URL:', parseError);
            // Still try to get session - Supabase might have processed it
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              router.replace('/(tab)');
            }
          }
        } else if (result.type === 'cancel') {
          // User cancelled the OAuth flow
          console.log('OAuth cancelled by user');
        }
      }
      // Supabase listener in root layout will update auth state when complete
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.message || 'Google sign in encountered an error');
    }
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
      backgroundColor: colors.background,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 32,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 5,
    },
    headerContainer: {
      marginBottom: 32,
      alignItems: 'center',
    },
    logoContainer: {
      marginBottom: 16,
      padding: 16,
      backgroundColor: colors.primary + '20', // 20% opacity hex
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginTop: 12,
      color: colors.foreground,
      letterSpacing: 0.5,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: colors.mutedForeground,
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 24,
    },
    form: {
      width: '100%',
      marginBottom: 24,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 8,
      marginLeft: 4,
    },
    input: {
      backgroundColor: colors.muted,
      borderWidth: 1,
      borderColor: 'transparent',
      borderRadius: 16,
      padding: 16,
      fontSize: 16,
      color: colors.foreground,
    },
    inputFocused: {
      borderColor: colors.primary,
      backgroundColor: colors.background,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 24,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      color: colors.mutedForeground,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    googleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingVertical: 14,
      backgroundColor: colors.background,
    },
    googleButtonText: {
      color: colors.foreground,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 12,
    },
    footerContainer: {
      marginTop: 32,
      alignItems: 'center',
    },
    linkText: {
      color: colors.mutedForeground,
      fontSize: 15,
    },
    linkTextBold: {
      color: colors.primary,
      fontWeight: 'bold',
    },
  });

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    try {
      const loginData: LoginData = { email: email.trim(), password };
      await login(loginData);
      router.replace('/(tab)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.headerContainer}>
            <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="chatbubbles" size={40} color={colors.primary} />
            </Animated.View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account to continue chatting</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={[styles.input, emailFocused && styles.inputFocused]}
                placeholder="name@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={[styles.input, passwordFocused && styles.inputFocused]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoggingIn && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoggingIn}
              activeOpacity={0.8}
            >
              {isLoggingIn ? (
                <ActivityIndicator color={colors.primaryForeground} size="large" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

      <TouchableOpacity 
        style={styles.googleButton} 
        onPress={handleGoogle}
        disabled={isLoggingIn}
      >
              <Ionicons name="logo-google" size={24} color={colors.foreground} />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/sign-up')}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>
                Do not have an account? <Text style={styles.linkTextBold}>Create one</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
