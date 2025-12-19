import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useThemeColors } from '../../src/utils/theme';
import type { RegisterData } from '../../src/types/auth.types';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const { register, isSigningUp } = useAuthStore();
  const router = useRouter();
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 32,
      backgroundColor: colors.background,
    },
    headerContainer: {
      marginBottom: 36,
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      marginBottom: 12,
      textAlign: 'center',
      color: colors.foreground,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.mutedForeground,
      marginBottom: 8,
      textAlign: 'center',
      fontWeight: '500',
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
    },
    input: {
      height: 56,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      fontSize: 16,
      backgroundColor: colors.card,
      color: colors.foreground,
      fontWeight: '500',
    },
    inputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    button: {
      height: 56,
      backgroundColor: colors.primary,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 28,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
      gap: 12,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      color: colors.mutedForeground,
      fontSize: 14,
      fontWeight: '500',
    },
    linkButton: {
      marginTop: 20,
      alignItems: 'center',
      paddingVertical: 12,
    },
    linkText: {
      color: colors.mutedForeground,
      fontSize: 15,
      fontWeight: '500',
      textAlign: 'center',
    },
    linkTextBold: {
      color: colors.primary,
      fontWeight: '700',
    },
    footerContainer: {
      alignItems: 'center',
      paddingTop: 16,
    },
  });

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const registerData: RegisterData = {
        name: name.trim(),
        email: email.trim(),
        password,
      };
      await register(registerData);
      router.replace('/(tab)');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Failed to create account');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join and start chatting with friends</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={[styles.input, nameFocused && styles.inputFocused]}
              placeholder="John Doe"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              autoCapitalize="words"
            />
          </View>

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

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirm Password</Text>
            <TextInput
              style={[styles.input, confirmFocused && styles.inputFocused]}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isSigningUp && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isSigningUp}
            activeOpacity={0.8}
          >
            {isSigningUp ? (
              <ActivityIndicator color={colors.primaryForeground} size="large" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Already member?</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.footerContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.linkButton}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

