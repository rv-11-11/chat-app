import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NewChatModal from '../../src/components/NewChatModal';
import NotificationDropdown from '../../src/components/NotificationDropdown';
import { Avatar } from '../../src/components/Avatar';
import { useSocket } from '../../src/hooks/useSocket';
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore } from '../../src/store/chatStore';
import { useSocketStore } from '../../src/store/socketStore';
import type { Chat, Message } from '../../src/types/chat.types';
import { formatChatTime, getOtherUserAndGroup } from '../../src/utils/helpers';
import { useThemeColors } from '../../src/utils/theme';

export default function ChatListScreen() {
  const insets = useSafeAreaInsets();
  const { chats, fetchChats, isChatsLoading, addNewMessage, updateChatLastMessage, updateChatUnread, addNewChat } = useChatStore();
  const { onlineUsers } = useSocketStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    newChatButton: { 
      width: 48, 
      height: 48, 
      borderRadius: 24, 
      backgroundColor: colors.primary, 
      justifyContent: 'center', 
      alignItems: 'center', 
      shadowColor: colors.primary, 
      shadowOffset: { width: 0, height: 4 }, 
      shadowOpacity: 0.3, 
      shadowRadius: 10, 
      elevation: 6,
    },
    newChatButtonText: { 
      color: colors.primaryForeground, 
      fontSize: 28, 
      fontWeight: '700', 
      lineHeight: 28,
    },
    searchContainer: { 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      backgroundColor: colors.background,
      gap: 8,
    },
    searchInput: { 
      backgroundColor: colors.muted, 
      borderRadius: 12, 
      paddingHorizontal: 16, 
      paddingVertical: 12, 
      fontSize: 16, 
      color: colors.foreground, 
      borderWidth: 1, 
      borderColor: colors.border,
      fontWeight: '500',
    },
    listContent: { 
      paddingVertical: 12, 
      paddingHorizontal: 16,
      gap: 8,
    },
    center: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    loadingText: { 
      marginTop: 16, 
      fontSize: 16, 
      color: colors.mutedForeground, 
      fontWeight: '500',
    },
    chatItem: { 
      flexDirection: 'row', 
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginVertical: 4,
      borderRadius: 12, 
      backgroundColor: colors.card, 
      borderWidth: 0.8, 
      borderColor: colors.border, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 1 }, 
      shadowOpacity: 0.06, 
      shadowRadius: 4, 
      elevation: 2,
    },
    chatContent: { 
      flex: 1, 
      justifyContent: 'center',
      gap: 8,
      marginLeft: 16,
    },
    chatHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      gap: 12,
    },
    chatName: { 
      fontSize: 16, 
      fontWeight: '700', 
      color: colors.foreground, 
      flex: 1, 
      letterSpacing: -0.2,
    },
    chatTime: { 
      fontSize: 12, 
      color: colors.mutedForeground, 
      fontWeight: '500',
      flexShrink: 1,
    },
    chatFooter: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      gap: 12,
    },
    lastMessage: { 
      fontSize: 14, 
      color: colors.mutedForeground, 
      flex: 1, 
      fontWeight: '400',
    },
    unreadBadge: { 
      backgroundColor: colors.primary, 
      borderRadius: 12, 
      minWidth: 26, 
      height: 26, 
      justifyContent: 'center', 
      alignItems: 'center', 
      paddingHorizontal: 8,
      flexShrink: 1,
      shadowColor: colors.primary, 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.25, 
      shadowRadius: 4, 
      elevation: 2,
    },
    unreadBadgeText: { 
      color: colors.primaryForeground, 
      fontSize: 11, 
      fontWeight: '700',
    },
    emptyText: { 
      fontSize: 22, 
      fontWeight: '700', 
      color: colors.foreground, 
      marginBottom: 12,
      textAlign: 'center',
    },
    emptySubtext: { 
      fontSize: 15, 
      color: colors.mutedForeground, 
      textAlign: 'center', 
      fontWeight: '500', 
      lineHeight: 22,
    },
  });

  useEffect(() => {
    fetchChats();
  }, []);

  // Socket listeners
  useSocket({
    onChatNew: (chat: Chat) => {
      addNewChat(chat);
    },
    onChatUpdate: (data: { chatId: string; lastMessage: Message }) => {
      updateChatLastMessage(data.chatId, data.lastMessage);
      // Also update unread count if not current chat
      const currentChatId = useChatStore.getState().currentChat?._id;
      if (data.chatId !== currentChatId) {
        updateChatUnread(data.chatId, 1);
      }
    },
    onNewMessage: (message: Message) => {
      // Only handle full message objects here
      if (message && message._id && message.chatId) {
        addNewMessage(message);
        // Update chat list with last message
        updateChatLastMessage(message.chatId, message);
        // Update unread count if not current chat
        const currentChatId = useChatStore.getState().currentChat?._id;
        if (message.chatId !== currentChatId) {
          updateChatUnread(message.chatId, 1);
        }
      }
    },
  });

  // Filter chats based on search
  const nonNullChats = chats.filter((c): c is Chat => !!c);

  const filteredChats = nonNullChats
    .filter((chat) => {
      if (!searchQuery.trim()) return true;
      const { name } = getOtherUserAndGroup(chat, user?._id || null, onlineUsers);
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      // Sort by last message time, most recent first
      const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    })
    .filter((chat) => {
      // Show Direct chats and Private Groups (Group DMs)
      if (chat.type === 'CHANNEL') return false;
      if (chat.type === 'DIRECT') return true;
      if (chat.type === 'GROUP') {
        return chat.isPublic === false; 
      }
      // Fallback for older data structure where type might be missing but isGroup exists
      if (chat.isGroup) return chat.isPublic === false;
      return true; // Default to showing if unsure (likely direct)
    });

  const getChatName = (chat: Chat): string => {
    const { name } = getOtherUserAndGroup(chat, user?._id || null, onlineUsers);
    return name;
  };

  const getChatAvatar = (chat: Chat): string | null => {
    const { avatar } = getOtherUserAndGroup(chat, user?._id || null, onlineUsers);
    return avatar;
  };

  const getChatOnlineStatus = (chat: Chat): boolean => {
    const { isOnline } = getOtherUserAndGroup(chat, user?._id || null, onlineUsers);
    return isOnline;
  };

  const getLastMessage = (chat: Chat): string => {
    if (!chat.lastMessage) return 'Send a message';
    if (chat.lastMessage.messageType === 'SYSTEM') {
      return 'Send a message';
    }
    if (chat.lastMessage.image) return '📷 Photo';
    if (chat.lastMessage.video) return '🎥 Video';
    if (chat.lastMessage.file) return '📎 File';
    return chat.lastMessage.content || 'Send a message';
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const chatName = getChatName(item) || 'Unknown';
    const avatar = getChatAvatar(item);
    const isOnline = getChatOnlineStatus(item);
    const lastMessage = getLastMessage(item) || 'No message';

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item._id}`)}
        activeOpacity={0.7}
      >
        <Avatar
          uri={avatar || undefined}
          name={chatName}
          size={56}
          isOnline={isOnline}
          showStatus={true}
        />
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {String(chatName)}
            </Text>
            {item.lastMessage ? (
              <Text style={styles.chatTime}>
                {String(formatChatTime(item.lastMessage.createdAt))}
              </Text>
            ) : null}
          </View>
          <View style={styles.chatFooter}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {String(lastMessage)}
            </Text>
            {(item.unreadCount && item.unreadCount > 0) ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {String(item.unreadCount > 99 ? '99+' : item.unreadCount)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isChatsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <NotificationDropdown />
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => setIsNewChatModalVisible(true)}
          >
            <Text style={styles.newChatButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item, index) => `${item._id}-${index}`}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>
              {searchQuery ? '🔍' : '💬'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search' : 'Tap + to start a new conversation!'}
            </Text>
          </View>
        }
      />
      <NewChatModal
        visible={isNewChatModalVisible}
        onClose={() => setIsNewChatModalVisible(false)}
      />
    </View>
  );
}


