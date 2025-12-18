import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import GroupDetailsModal from '../../src/components/GroupDetailsModal';
import { useSocket } from '../../src/hooks/useSocket';
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore } from '../../src/store/chatStore';
import { useSocketStore } from '../../src/store/socketStore';
import type { Message } from '../../src/types/chat.types';
import { formatMessageTime, getOtherUserAndGroup } from '../../src/utils/helpers';
import { useThemeColors } from '../../src/utils/theme';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { currentChat, messages, fetchChat, sendMessage, addNewMessage, removeMessage, isSendingMessage, markAsRead } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const { socket } = useSocket({});
  const router = useRouter();
  const [messageText, setMessageText] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.card, borderBottomWidth: 0.5, borderBottomColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    backButton: { marginRight: 13, padding: 6 },
    backButtonText: { fontSize: 26, color: colors.primary, fontWeight: '800' },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: 19, fontWeight: '700', color: colors.foreground, letterSpacing: -0.3 },
    headerSubtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 3, fontWeight: '500' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, fontSize: 16, color: colors.mutedForeground, fontWeight: '500' },
    messagesList: { paddingVertical: 12, paddingHorizontal: 8 },
    messageContainer: { marginBottom: 10, alignItems: 'flex-start', paddingHorizontal: 6 },
    myMessageContainer: { alignItems: 'flex-end' },
    messageBubble: { maxWidth: '78%', backgroundColor: colors.card, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
    myMessageBubble: { backgroundColor: colors.primary, borderBottomLeftRadius: 22, borderBottomRightRadius: 4 },
    replyPreview: { backgroundColor: colors.muted, padding: 10, borderRadius: 12, marginBottom: 9, borderLeftWidth: 4, borderLeftColor: colors.primary },
    replyText: { fontSize: 12, color: colors.mutedForeground, fontStyle: 'italic', fontWeight: '500' },
    mediaIndicator: { fontSize: 15, marginBottom: 5, color: colors.foreground, fontWeight: '600' },
    messageText: { fontSize: 16, color: colors.foreground, marginBottom: 5, lineHeight: 22 },
    myMessageText: { color: colors.primaryForeground },
    messageTime: { fontSize: 11, color: colors.mutedForeground, alignSelf: 'flex-end', fontWeight: '500' },
    myMessageTime: { color: 'rgba(255,255,255,0.75)' },
    inputContainer: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 13, backgroundColor: colors.card, borderTopWidth: 0.5, borderTopColor: colors.border, alignItems: 'flex-end', shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    input: { flex: 1, borderWidth: 1.2, borderColor: colors.border, borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, maxHeight: 110, marginRight: 10, color: colors.foreground, backgroundColor: colors.muted, fontSize: 16 },
    sendButton: { backgroundColor: colors.primary, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
    sendButtonDisabled: { opacity: 0.55 },
    sendButtonText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 15 },
    typingIndicator: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', gap: 8 },
    typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
    typingText: { fontSize: 13, color: colors.mutedForeground, marginLeft: 4, fontWeight: '500' },
  });

  useEffect(() => {
    if (chatId) {
      fetchChat(chatId);
      markAsRead(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    if (!socket || !chatId) return;

    const handleUserTyping = (data: { userId: string; chatId: string }) => {
      if (data.chatId !== chatId || data.userId === user?._id) return;

      setTypingUsers((prev) => {
        const filtered = prev.filter((id) => id !== data.userId);
        return [...filtered, data.userId];
      });

      if (typingTimeoutRef.current[data.userId]) {
        clearTimeout(typingTimeoutRef.current[data.userId]);
      }

      typingTimeoutRef.current[data.userId] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
        delete typingTimeoutRef.current[data.userId];
      }, 3000);
    };

    socket.on('user:typing', handleUserTyping);
    return () => {
      socket.off('user:typing', handleUserTyping);
    };
  }, [socket, chatId, user?._id]);

  // Socket listeners and room management
  const { joinChat, leaveChat } = useSocket({
    onNewMessage: (message: Message) => {
      if (message.chatId === chatId) {
        addNewMessage(message);
      }
    },
    onMessageDeleted: (data: { chatId: string; messageId: string }) => {
      if (data.chatId === chatId) {
        removeMessage(data.messageId);
      }
    },
  });

  useEffect(() => {
    if (chatId) {
      joinChat(chatId);
      return () => {
        leaveChat(chatId);
      };
    }
  }, [chatId, joinChat, leaveChat]);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!messageText.trim() || !chatId) return;
    
    const content = messageText.trim();
    setMessageText('');
    
    try {
      await sendMessage({
        chatId,
        content,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = (text: string) => {
    setMessageText(text);
    if (socket && chatId && text.trim()) {
      socket.emit('user:typing', { chatId, userId: user?._id });
    }
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return 'Someone is typing...';
    if (typingUsers.length === 2) return '2 people are typing...';
    return `${typingUsers.length} people are typing...`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender?._id === user?._id;
    
    return (
      <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
        <View style={[styles.messageBubble, isMyMessage && styles.myMessageBubble]}>
          {item.replyTo && (
            <View style={styles.replyPreview}>
              <Text style={styles.replyText} numberOfLines={1}>
                {item.replyTo.content || 'Message'}
              </Text>
            </View>
          )}
          {item.image && (
            <Text style={styles.mediaIndicator}>📷 Image</Text>
          )}
          {item.video && (
            <Text style={styles.mediaIndicator}>🎥 Video</Text>
          )}
          {item.file && (
            <Text style={styles.mediaIndicator}>📎 {item.file.name}</Text>
          )}
          {item.content && (
            <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
              {item.content}
            </Text>
          )}
          <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  const getChatName = () => {
    if (!currentChat) return 'Chat';
    const { name } = getOtherUserAndGroup(currentChat, user?._id || null, onlineUsers);
    return name;
  };

  const getChatAvatar = () => {
    if (!currentChat) return null;
    const { avatar } = getOtherUserAndGroup(currentChat, user?._id || null, onlineUsers);
    return avatar;
  };

  const getChatOnlineStatus = () => {
    if (!currentChat) return false;
    const { isOnline } = getOtherUserAndGroup(currentChat, user?._id || null, onlineUsers);
    return isOnline;
  };

  if (!currentChat) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {getChatName()}
          </Text>
          <Text style={styles.headerSubtitle}>
            {getChatOnlineStatus() ? 'Online' : 'Offline'}
          </Text>
        </View>
        {currentChat?.isGroup && (
          <TouchableOpacity onPress={() => setIsGroupModalOpen(true)} style={{ padding: 8 }}>
            <Text style={{ color: colors.primary }}>Group</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          typingUsers.length > 0 ? (
            <View style={styles.typingIndicator}>
              <View style={[styles.typingDot, { animation: 'pulse' }]} />
              <View style={[styles.typingDot, { animation: 'pulse', animationDelay: '0.2s' }]} />
              <View style={[styles.typingDot, { animation: 'pulse', animationDelay: '0.4s' }]} />
              <Text style={styles.typingText}>{getTypingText()}</Text>
            </View>
          ) : null
        }
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={colors.mutedForeground}
          value={messageText}
          onChangeText={handleInputChange}
          multiline
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!messageText.trim() || isSendingMessage) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim() || isSendingMessage}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
      <GroupDetailsModal visible={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} chat={currentChat} />
    </KeyboardAvoidingView>
  );
}



