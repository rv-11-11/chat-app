import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { supabase } from '../src/services/supabase';
import { secureStorage } from '../src/services/storage/secureStore';
import { useAuthStore } from '../src/store/authStore';

export default function DebugScreen() {
  const [supaUser, setSupaUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const appUser = useAuthStore((s) => s.user);
  const checkAuthStatus = useAuthStore((s) => s.checkAuthStatus);

  const refresh = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      setSupaUser(data?.user || null);
    } catch {
      setSupaUser(null);
    }
    try {
      const token = await secureStorage.get('authToken');
      setAuthToken(token || null);
    } catch {
      setAuthToken(null);
    }
  };

  const doCheck = async () => {
    await checkAuthStatus();
    await refresh();
  };

  const doSignOut = async () => {
    try {
      await useAuthStore.getState().logout();
    } catch {}
    await refresh();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Debug - Auth State</Text>

      <View style={styles.block}>
        <Text style={styles.heading}>Supabase getUser()</Text>
        <Text style={styles.value}>{JSON.stringify(supaUser, null, 2)}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.heading}>Backend authToken (secureStorage)</Text>
        <Text style={styles.value}>{authToken ? authToken : 'null'}</Text>
      </View>

      <View style={styles.block}>
        <Text style={styles.heading}>App store user</Text>
        <Text style={styles.value}>{JSON.stringify(appUser, null, 2)}</Text>
      </View>

      <View style={styles.actions}>
        <Button title="Refresh" onPress={refresh} />
        <View style={{ height: 12 }} />
        <Button title="Check Auth Status (backend)" onPress={doCheck} />
        <View style={{ height: 12 }} />
        <Button title="Sign out" onPress={doSignOut} />
      </View>

      <View style={{ height: 40 }} />

      <Text style={styles.note}>Open this screen after completing Google OAuth in the app to inspect values.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    minHeight: '100%'
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  block: { marginBottom: 12 },
  heading: { fontWeight: '700' },
  value: { fontFamily: 'monospace', marginTop: 8 },
  actions: { marginTop: 16 }
  ,note: { marginTop: 16, color: '#666' }
});
