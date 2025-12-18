import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import "../../global.css";
import { useChatStore } from '../../src/store/chatStore';
import { chatApi } from '../../src/services/api/chat';
import { useAuthStore } from '../../src/store/authStore';
import GroupCreateModal from '../../src/components/GroupCreateModal';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../../src/utils/theme';

export default function GroupListScreen() {
  const { chats, fetchChats, isChatsLoading } = useChatStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: colors.border, backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: colors.foreground, letterSpacing: -0.5 },
    newButton: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 3 },
    newButtonText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 14 },
    item: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 13, alignItems: 'center', marginHorizontal: 10, marginVertical: 6, borderRadius: 16, backgroundColor: colors.card, borderWidth: 0.8, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 13 },
    avatarText: { color: colors.primaryForeground, fontSize: 22, fontWeight: '800' },
    info: { flex: 1 },
    title: { fontSize: 16, fontWeight: '700', color: colors.foreground, letterSpacing: -0.2 },
    subtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 4, fontWeight: '400' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    menuBtn: { padding: 10 },
  });

  useEffect(() => {
    fetchChats();
  }, []);

  const groupChats = chats.filter((c) => c.isGroup || c.type === 'GROUP');

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.item} onPress={() => router.push(`/chat/${item._id}`)}>
      <View style={styles.avatar}>{item.icon ? <Text>IMG</Text> : <Text style={styles.avatarText}>{(item.groupName || 'G').charAt(0).toUpperCase()}</Text>}</View>
      <View style={styles.info}>
        <Text style={styles.title}>{item.groupName || 'Unnamed Group'}</Text>
        <Text style={styles.subtitle}>{item.lastMessage?.content || 'No messages yet'}</Text>
      </View>
      <TouchableOpacity style={styles.menuBtn} onPress={() => onGroupMenu(item)}>
        <Text style={{ fontSize: 18, color: colors.mutedForeground }}>⋮</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const onGroupMenu = (group: any) => {
    Alert.alert(group.groupName || 'Group', undefined, [
      { text: 'Leave Group', onPress: async () => { try { await chatApi.removeMember(group._id, useAuthStore.getState().user?._id || ''); fetchChats(); } catch (e) { console.error(e); } } },
      { text: 'Delete Group', style: 'destructive', onPress: async () => { try { await chatApi.deleteChat(group._id); fetchChats(); } catch (e) { console.error(e); } } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (isChatsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.mutedForeground }}>Loading groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => setIsCreateOpen(true)}>
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groupChats}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListEmptyComponent={<View style={styles.center}><Text style={{ color: colors.mutedForeground }}>No groups yet</Text></View>}
      />

      <GroupCreateModal visible={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </View>
  );
}

