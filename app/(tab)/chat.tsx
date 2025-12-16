import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useChatStore } from '../../src/store/chatStore';
import { useSocket } from '../../src/hooks/useSocket';
import { useSocketStore } from '../../src/store/socketStore';
import { useAuthStore } from '../../src/store/authStore';
import { formatChatTime, getOtherUserAndGroup } from '../../src/utils/helpers';
import type { Chat, Message } from '../../src/types/chat.types';
import NewChatModal from '../../src/components/NewChatModal';

export default function ChatListScreen() {
  const { chats, fetchChats, isChatsLoading, addNewMessage, updateChatLastMessage, updateChatUnread, addNewChat } = useChatStore();
  const { onlineUsers } = useSocketStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [isNewChatModalVisible, setIsNewChatModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  const filteredChats = chats
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
    .filter((chat) => !chat.isGroup && chat.type !== 'CHANNEL'); // Only direct chats

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
    const chatName = getChatName(item);
    const avatar = getChatAvatar(item);
    const isOnline = getChatOnlineStatus(item);
    const lastMessage = getLastMessage(item);

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => router.push(`/chat/${item._id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, avatar && { backgroundColor: '#e0e0e0' }]}>
            {avatar ? (
              <Text style={styles.avatarText}>IMG</Text>
            ) : (
              <Text style={styles.avatarText}>
                {chatName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          {isOnline && <View style={styles.onlineBadge} />}
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {chatName}
            </Text>
            {item.lastMessage && (
              <Text style={styles.chatTime}>
                {formatChatTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <View style={styles.chatFooter}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage}
            </Text>
            {item.unreadCount && item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isChatsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => setIsNewChatModalVisible(true)}
        >
          <Text style={styles.newChatButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item._id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.center}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
  listContent: {
    padding: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    marginVertical: 2,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
