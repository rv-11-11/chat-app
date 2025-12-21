import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import "../../global.css";
import GroupCreateModal from '../../src/components/GroupCreateModal';
import { chatApi } from '../../src/services/api/chat';
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore } from '../../src/store/chatStore';
import { useThemeColors } from '../../src/utils/theme';

export default function GroupListScreen() {
  const insets = useSafeAreaInsets();
  const { chats, fetchChats, isChatsLoading } = useChatStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      borderBottomWidth: 0.5, 
      borderBottomColor: colors.border, 
      backgroundColor: colors.card, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.06, 
      shadowRadius: 8, 
      elevation: 3,
    },
    headerTitle: { 
      fontSize: 32, 
      fontWeight: '800', 
      color: colors.foreground, 
      letterSpacing: -0.5,
    },
    newButton: { 
      backgroundColor: colors.primary, 
      paddingHorizontal: 16, 
      paddingVertical: 10, 
      borderRadius: 10, 
      shadowColor: colors.primary, 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.25, 
      shadowRadius: 5, 
      elevation: 3,
    },
    newButtonText: { 
      color: colors.primaryForeground, 
      fontWeight: '700', 
      fontSize: 14,
    },
    item: { 
      flexDirection: 'row', 
      paddingHorizontal: 16, 
      paddingVertical: 14, 
      alignItems: 'center', 
      marginHorizontal: 16, 
      marginVertical: 6, 
      borderRadius: 12, 
      backgroundColor: colors.card, 
      borderWidth: 0.8, 
      borderColor: colors.border, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 1 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 3, 
      elevation: 2,
    },
    avatar: { 
      width: 56, 
      height: 56, 
      borderRadius: 28, 
      backgroundColor: colors.primary, 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginRight: 14,
    },
    avatarText: { 
      color: colors.primaryForeground, 
      fontSize: 20, 
      fontWeight: '700',
    },
    info: { 
      flex: 1,
      gap: 6,
    },
    title: { 
      fontSize: 16, 
      fontWeight: '700', 
      color: colors.foreground, 
      letterSpacing: -0.2,
    },
    subtitle: { 
      fontSize: 13, 
      color: colors.mutedForeground, 
      fontWeight: '400',
    },
    center: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    menuBtn: { 
      padding: 8,
      marginLeft: 8,
    },
    menuText: {
      fontSize: 18,
      color: colors.mutedForeground,
      fontWeight: '600',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.mutedForeground,
      fontWeight: '500',
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 10,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      fontWeight: '500',
    },
  });

  useEffect(() => {
    fetchChats();
  }, []);

  const groupChats = chats.filter((c) => c.isGroup || c.type === 'GROUP');

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.item} onPress={() => router.push(`/chat/${item._id}`)} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.groupName || 'G').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.groupName || 'Unnamed Group'}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{item.lastMessage?.content || 'No messages yet'}</Text>
      </View>
      <TouchableOpacity style={styles.menuBtn} onPress={() => onGroupMenu(item)}>
        <Text style={styles.menuText}>⋮</Text>
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
        <Text style={styles.loadingText}>Loading groups...</Text>
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
        contentContainerStyle={{ paddingVertical: 12 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>Create or join a group to get started</Text>
          </View>
        }
      />

      <GroupCreateModal visible={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </View>
  );
}

