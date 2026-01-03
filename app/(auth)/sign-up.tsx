import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeColors } from '../../src/utils/theme';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  const { register, googleLogin, isSigningUp, isLoggingIn } = useAuthStore();
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

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ENV.GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: ENV.GOOGLE_IOS_CLIENT_ID,
    webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      fetchUserInfo(authentication?.accessToken);
    } else if (response?.type === 'error') {
      Alert.alert('Sign in failed', 'Google sign in encountered an error');
    }
  }, [response]);

  const fetchUserInfo = async (token: string | undefined) => {
    if (!token) return;
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = await res.json();
      await googleLogin({
        email: user.email,
        name: user.name,
        googleId: user.id,
        avatar: user.picture,
      });
      router.replace('/(tab)');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Google Sign-In Failed', error?.message || 'Could not fetch user info');
    }
  };

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      router.replace('/(tab)');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Failed to create account');
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
    header: {
      alignItems: 'center',
      marginBottom: 32,
    },
    logoContainer: {
        marginBottom: 16,
        padding: 16,
        backgroundColor: colors.primary + '20', // 20% opacity hex
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.foreground,
        marginTop: 12,
        letterSpacing: 0.5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.mutedForeground,
      marginTop: 8,
      textAlign: 'center',
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
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
    signUpButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    signUpButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
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
    footer: {
      marginTop: 32,
      alignItems: 'center',
    },
    footerText: {
      color: colors.mutedForeground,
      fontSize: 15,
    },
    signInLink: {
      color: colors.primary,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
            <View style={styles.header}>
                <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
                    <Ionicons name="chatbubbles" size={40} color={colors.primary} />
                </Animated.View>
                <Text style={styles.appTitle}>LinkiPlay</Text>
                <Text style={styles.subtitle}>Join the conversation</Text>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                style={[styles.input, nameFocused && styles.inputFocused]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.mutedForeground}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                style={[styles.input, emailFocused && styles.inputFocused]}
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                style={[styles.input, passwordFocused && styles.inputFocused]}
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                />
            </View>

            <TouchableOpacity 
                style={styles.signUpButton} 
                onPress={handleSignUp}
                disabled={isSigningUp || isLoggingIn}
            >
                {(isSigningUp || isLoggingIn) ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.signUpButtonText}>Create Account</Text>
                )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
                style={styles.googleButton} 
                onPress={() => promptAsync()}
                disabled={!request || isSigningUp || isLoggingIn}
            >
                <Ionicons name="logo-google" size={24} color={colors.foreground} />
                <Text style={styles.googleButtonText}>Sign up with Google</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Already have an account?{' '}
                    <Text onPress={() => router.push('/(auth)/sign-in')} style={styles.signInLink}>
                        Log in
                    </Text>
                </Text>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
