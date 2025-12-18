import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import apiClient from '../src/services/api/client';
import { secureStorage } from '../src/services/storage/secureStore';
import { useAuthStore } from '../src/store/authStore';
import { useThemeColors } from '../src/utils/theme';

export default function AcceptInviteScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [info, setInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { width: '100%', maxWidth: 520, padding: 20, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center' },
    title: { fontSize: 20, fontWeight: '700', color: colors.foreground },
    subtitle: { color: colors.mutedForeground, marginTop: 8, marginBottom: 16 },
    joinBtn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
    joinText: { color: colors.primaryForeground, fontWeight: '600' },
  });

  const type = (params.type as string) || 'group';
  const id = (params.id as string) || (params.invite as string) || null;

  useEffect(() => {
    if (!id) return setLoading(false);
    (async () => {
      setLoading(true);
      try {
        // Try resolving invite (may be short code or username)
        const resolveRes = await apiClient.get(`/invite/resolve/${id}`).catch(() => null);
        const resolvedId = resolveRes?.data?.resolvedId || id;

        if (type === 'group') {
          const { data } = await apiClient.get(`/chat/${resolvedId}/invite-info`).catch(() => ({ data: null }));
          setInfo({ ...data?.info, kind: 'group', resolvedId });
        } else if (type === 'channel') {
          const { data } = await apiClient.get(`/channel/${resolvedId}/invite-info`).catch(() => ({ data: null }));
          setInfo({ ...data?.info, kind: 'channel', resolvedId });
        } else {
          setInfo(null);
        }
      } catch (err) {
        setInfo(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, type]);

  const handleJoin = async () => {
    if (!info) return;
    if (!user) {
      // Save pending invite and navigate to sign-in
      await secureStorage.set('pendingInvite', JSON.stringify({ type: info.kind === 'channel' ? 'channel' : 'group', id: info._id || info.resolvedId }));
      router.replace('/(auth)/sign-in');
      return;
    }

    setJoining(true);
    try {
      if (info.kind === 'group') {
        // Join by invite
        await apiClient.post(`/chat/${info._id || info.resolvedId}/join-by-invite`);
        router.replace(`/chat/${info._id || info.resolvedId}`);
      } else if (info.kind === 'channel') {
        await apiClient.post(`/channel/${info._id || info.resolvedId}/join-by-invite`);
        router.replace('/(tab)/channel');
      }
    } catch (err: any) {
      Alert.alert('Join Failed', err?.response?.data?.message || 'Unable to join invite');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ marginTop: 12, color: colors.mutedForeground }}>Loading invite...</Text></View>
  );

  if (!info) return (
    <View style={styles.center}><Text style={{ fontSize: 18, fontWeight: '600', color: colors.mutedForeground }}>Invalid or expired invite</Text></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{info.groupName || info.name || 'Invite'}</Text>
        <Text style={styles.subtitle}>{(info.participantsCount || info.membersCount || info.subscriberCount || 0) + (info.kind === 'channel' ? ' subscribers' : ' members')}</Text>

        <TouchableOpacity style={[styles.joinBtn, joining && { opacity: 0.6 }]} onPress={handleJoin} disabled={joining}>
          <Text style={styles.joinText}>{joining ? 'Joining...' : (user ? (info.kind === 'channel' ? 'Join Channel' : 'Join Group') : 'Sign in to Join')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


