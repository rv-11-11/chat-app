import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChatStore } from '../../src/store/chatStore';
import { useSocket } from '../../src/hooks/useSocket';
import { useAuthStore } from '../../src/store/authStore';
import { useSocketStore } from '../../src/store/socketStore';
import { formatMessageTime, getOtherUserAndGroup } from '../../src/utils/helpers';
import type { Message } from '../../src/types/chat.types';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { currentChat, messages, fetchChat, sendMessage, addNewMessage, removeMessage, isSendingMessage, markAsRead } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const router = useRouter();
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (chatId) {
      fetchChat(chatId);
      // Mark as read when opening chat
      markAsRead(chatId);
    }
  }, [chatId]);

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
        <ActivityIndicator size="large" color="#007AFF" />
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
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={messageText}
          onChangeText={setMessageText}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 8,
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 4,
  },
  replyPreview: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  replyText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  mediaIndicator: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  myMessageText: {
    color: '#fff',
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

