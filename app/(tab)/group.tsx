import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View, TextInput, Modal, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import "../../global.css";
import GroupCreateModal from '../../src/components/GroupCreateModal';
import NotificationDropdown from '../../src/components/NotificationDropdown';
import { chatApi } from '../../src/services/api/chat';
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore } from '../../src/store/chatStore';
import { useThemeColors } from '../../src/utils/theme';
import { Avatar } from '../../src/components/Avatar';
import { Ionicons } from '@expo/vector-icons';

export default function GroupListScreen() {
  const insets = useSafeAreaInsets();
  const { chats, fetchChats, isChatsLoading } = useChatStore();
  const { user } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; item: any | null }>({ visible: false, item: null });
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
    searchBar: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 8,
      backgroundColor: colors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    searchInput: {
      borderWidth: 1.2,
      borderColor: colors.border,
      borderRadius: 22,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: colors.foreground,
      backgroundColor: colors.muted,
      fontSize: 15,
      fontWeight: '500',
    },
    menuOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    menuContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      paddingBottom: 32,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
    },
    menuItemText: {
      fontSize: 16,
      marginLeft: 12,
      color: colors.foreground,
    },
    menuItemDestructive: {
      color: '#ef4444',
    },
  });

  useEffect(() => {
    fetchChats();
  }, []);

  const groupChats = chats.filter((c) => c.isGroup || c.type === 'GROUP');
  const filteredGroups = groupChats.filter((g) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (g.groupName || '').toLowerCase();
    const last = (g.lastMessage?.content || '').toLowerCase();
    const participants = (g.participants || []).map((p: any) => (p.username || p.name || '').toLowerCase()).join(' ');
    return name.includes(q) || last.includes(q) || participants.includes(q);
  });

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.item} onPress={() => router.push(`/chat/${item._id}`)} activeOpacity={0.7}>
      <Avatar
        uri={item.icon}
        name={item.groupName || 'Group'}
        size={56}
        style={{ marginRight: 14 }}
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.groupName || 'Unnamed Group'}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{item.lastMessage?.content || 'No messages yet'}</Text>
      </View>
      <TouchableOpacity style={styles.menuBtn} onPress={() => onGroupMenu(item)}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.mutedForeground} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const onGroupMenu = (group: any) => {
    setContextMenu({ visible: true, item: group });
  };

  const handleAction = async (action: 'delete' | 'leave') => {
    const { item } = contextMenu;
    if (!item) return;

    setContextMenu({ visible: false, item: null });

    try {
      if (action === 'delete') {
         await chatApi.deleteChat(item._id);
         fetchChats(); 
      } else if (action === 'leave') {
         await chatApi.removeMember(item._id, useAuthStore.getState().user?._id || '');
         fetchChats();
      }
    } catch (error) {
      console.error('Action failed', error);
      Alert.alert('Error', 'Failed to perform action');
    }
  };

  const confirmAction = (action: 'delete' | 'leave') => {
    const { item } = contextMenu;
    if (!item) return;
    
    const title = action === 'delete' ? 'Delete Group' : 'Leave Group';
    const message = action === 'delete' 
      ? 'Permanently delete this group?' 
      : `Are you sure you want to leave ${item.groupName}?`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: action === 'delete' ? 'Delete' : 'Leave', style: 'destructive', onPress: () => handleAction(action) }
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <NotificationDropdown />
          <TouchableOpacity style={styles.newButton} onPress={() => setIsCreateOpen(true)}>
            <Text style={styles.newButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups by name or member..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 12 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>
              {searchQuery ? '🔍' : '👥'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No groups found' : 'No groups yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery 
                ? `No results matching "${searchQuery}"`
                : 'Create or join a group to get started'}
            </Text>
          </View>
        }
      />

      <GroupCreateModal visible={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      <Modal
        visible={contextMenu.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setContextMenu({ visible: false, item: null })}
      >
        <TouchableWithoutFeedback onPress={() => setContextMenu({ visible: false, item: null })}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContent}>
                {contextMenu.item && (() => {
                   const chat = contextMenu.item;
                   const isOwner = chat.createdBy === user?._id || (typeof chat.createdBy === 'object' && (chat.createdBy as any)._id === user?._id);
                   
                   return (
                     <>
                        {!isOwner && (
                          <TouchableOpacity 
                            style={styles.menuItem} 
                            onPress={() => confirmAction('leave')}
                          >
                            <Ionicons name="log-out-outline" size={24} color={colors.foreground} />
                            <Text style={styles.menuItemText}>Leave Group</Text>
                          </TouchableOpacity>
                        )}

                        {isOwner && (
                          <TouchableOpacity 
                            style={styles.menuItem} 
                            onPress={() => confirmAction('delete')}
                          >
                            <Ionicons name="trash-outline" size={24} color="#ef4444" />
                            <Text style={[styles.menuItemText, styles.menuItemDestructive]}>Delete Group</Text>
                          </TouchableOpacity>
                        )}
                     </>
                   );
                })()}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

