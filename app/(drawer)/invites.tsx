import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useInviteStore } from '../../src/store/inviteStore';
import { useThemeColors } from '../../src/utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerToggle } from '../../src/components/DrawerToggle';
import { Invite } from '../../src/services/api/invite';

export default function InvitesScreen() {
  const { invites, fetchInvites, isLoading, respondToInvite } = useInviteStore();
  const colors = useThemeColors();

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleRespond = (id: string, action: 'accept' | 'decline') => {
    Alert.alert(
      action === 'accept' ? 'Accept Invite' : 'Decline Invite',
      `Are you sure you want to ${action} this invite?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => respondToInvite(id, action).catch(e => Alert.alert('Error', (e as any).message)) }
      ]
    );
  };

  const renderItem = ({ item }: { item: Invite }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.senderInfo}>
            {item.sender?.avatar ? (
                <Image source={{ uri: item.sender.avatar }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.sender?.name?.[0]}</Text>
                </View>
            )}
            <View>
                <Text style={[styles.senderName, { color: colors.foreground }]}>{item.sender?.name || 'Unknown'}</Text>
                <Text style={[styles.time, { color: colors.mutedForeground }]}>invited you to join</Text>
            </View>
        </View>
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.targetIcon}>
            {item.targetIcon ? (
                <Image source={{ uri: item.targetIcon }} style={styles.targetImage} />
            ) : (
                <Ionicons name={item.targetType === 'CHANNEL' ? 'megaphone' : 'people'} size={24} color={colors.primary} />
            )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.targetName, { color: colors.foreground }]}>{item.targetName || 'Unnamed'}</Text>
            <Text style={[styles.targetType, { color: colors.mutedForeground }]}>{item.targetType}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.muted, marginRight: 8 }]}
            onPress={() => handleRespond(item._id, 'decline')}
        >
            <Text style={[styles.buttonText, { color: colors.foreground }]}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => handleRespond(item._id, 'accept')}
        >
            <Text style={[styles.buttonText, { color: '#fff' }]}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: 16 },
    card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    senderInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
    senderName: { fontWeight: '600', fontSize: 14 },
    time: { fontSize: 12 },
    content: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.muted, padding: 12, borderRadius: 8, marginBottom: 16 },
    targetIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
    targetImage: { width: '100%', height: '100%', borderRadius: 8 },
    targetName: { fontWeight: '700', fontSize: 16 },
    targetType: { fontSize: 12, fontWeight: '500' },
    actions: { flexDirection: 'row', justifyContent: 'flex-end' },
    button: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    buttonText: { fontWeight: '600', fontSize: 14 },
    empty: { textAlign: 'center', marginTop: 40, color: colors.mutedForeground, fontSize: 16 }
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <DrawerToggle />
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginLeft: 16, color: colors.foreground }}>Pending Invites</Text>
        </View>
        {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
            <FlatList
                data={invites}
                renderItem={renderItem}
                keyExtractor={i => i._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>No pending invites</Text>}
            />
        )}
    </SafeAreaView>
  );
}
