import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import "../../global.css";
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore } from '../../src/store/chatStore';
import { useSocket } from '../../src/hooks/useSocket';
import { channelApi } from '../../src/services/api/channel';
import { useThemeColors } from '../../src/utils/theme';
import { formatMessageTime } from '../../src/utils/helpers';
import type { Message } from '../../src/types/chat.types';

interface Channel {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  admins: Array<string | { _id: string }>;
  participants: Array<string | { _id: string }>;
  createdBy?: string | { _id: string };
}

export default function ChannelDetailScreen() {
  const insets = useSafeAreaInsets();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentChat, messages, fetchChat, sendMessage, addNewMessage, removeMessage, isSendingMessage } = useChatStore();
  const { socket } = useSocket({});
  const colors = useThemeColors();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [isLoadingChannel, setIsLoadingChannel] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: insets.top },
    header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: 16, 
      paddingVertical: 14, 
      backgroundColor: colors.card, 
      borderBottomWidth: 0.5, 
      borderBottomColor: colors.border, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.08, 
      shadowRadius: 8, 
      elevation: 3 
    },
    backButton: { marginRight: 12, padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', minWidth: 44, minHeight: 44 },
    backButtonText: { fontSize: 32, color: colors.primary, fontWeight: '800', textAlign: 'center', lineHeight: 40 },
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
    messageText: { fontSize: 16, color: colors.foreground, marginBottom: 5, lineHeight: 22 },
    myMessageText: { color: colors.primaryForeground },
    messageTime: { fontSize: 11, color: colors.mutedForeground, alignSelf: 'flex-end', fontWeight: '500' },
    myMessageTime: { color: 'rgba(255,255,255,0.75)' },
    inputContainer: { 
      flexDirection: 'row', 
      paddingHorizontal: 14, 
      paddingVertical: 12,
      backgroundColor: colors.card, 
      borderTopWidth: 0.5, 
      borderTopColor: colors.border, 
      alignItems: 'flex-end', 
      gap: 10,
    },
    input: { 
      flex: 1, 
      borderWidth: 1.2, 
      borderColor: colors.border, 
      borderRadius: 22, 
      paddingHorizontal: 18, 
      paddingVertical: 12, 
      maxHeight: 110, 
      color: colors.foreground, 
      backgroundColor: colors.muted, 
      fontSize: 16,
      fontWeight: '500',
    },
    sendButton: { backgroundColor: colors.primary, borderRadius: 22, paddingHorizontal: 22, paddingVertical: 12, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
    sendButtonDisabled: { opacity: 0.55 },
    sendButtonText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 15 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: 8, textAlign: 'center' },
    emptyDescription: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center' },
    notSubscribedContainer: { flex: 1, justifyContent: 'flex-end' },
    subscribeButton: { backgroundColor: colors.primary, paddingVertical: 14, alignItems: 'center', marginBottom: 16, marginHorizontal: 16, borderRadius: 12, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
    subscribeButtonText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 16 },
    readOnlyNotice: { paddingVertical: 12, backgroundColor: colors.muted, borderTopWidth: 0.5, borderTopColor: colors.border, alignItems: 'center' },
    readOnlyText: { fontSize: 13, color: colors.mutedForeground, fontWeight: '500' },
    typingIndicator: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', gap: 8 },
    typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
    typingText: { fontSize: 13, color: colors.mutedForeground, marginLeft: 4, fontWeight: '500' },
  });

  const currentUserId = user?._id || null;
  const isAdmin = useMemo(() => {
    if (!channel) return false;
    return channel.admins.some((admin: string | { _id: string }) => 
      (typeof admin === 'string' ? admin : admin._id)?.toString() === currentUserId?.toString()
    );
  }, [channel, currentUserId]);

  const isSubscribed = useMemo(() => {
    if (!channel) return false;
    return channel.participants.some((participant: string | { _id: string }) => 
      (typeof participant === 'string' ? participant : participant._id)?.toString() === currentUserId?.toString()
    );
  }, [channel, currentUserId]);

  // Fetch channel info
  useEffect(() => {
    if (!channelId) return;
    
    const fetchChannelInfo = async () => {
      setIsLoadingChannel(true);
      try {
        const res = await channelApi.getInfo(channelId);
        setChannel(res.channel);
      } catch (error) {
        console.error('Failed to fetch channel info:', error);
      } finally {
        setIsLoadingChannel(false);
      }
    };

    fetchChannelInfo();
  }, [channelId]);

  // Fetch channel messages (channels are stored as chats)
  useEffect(() => {
    if (!channelId) return;
    fetchChat(channelId);
  }, [channelId, fetchChat]);

  // Socket: Join channel room
  useEffect(() => {
    if (!channelId || !socket) return;

    socket.emit('channel:subscribe', channelId, (err?: string) => {
      if (err) {
        console.error('Failed to join channel:', err);
      }
    });

    // Also join chat room for messages
    socket.emit('chat:join', channelId);

    return () => {
      socket.emit('channel:unsubscribe', channelId);
      socket.emit('chat:leave', channelId);
    };
  }, [channelId, socket]);

  // Handle new messages from socket
  useEffect(() => {
    if (!socket || !channelId) return;

    const handleNewMessage = (message: Message) => {
      if (message.chatId === channelId) {
        addNewMessage(message);
      }
    };

    const handleMessageDeleted = (data: { chatId: string; messageId: string }) => {
      if (data.chatId === channelId) {
        removeMessage(data.messageId);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleMessageDeleted);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleMessageDeleted);
    };
  }, [socket, channelId, addNewMessage, removeMessage]);

  const handleSend = async () => {
    if (!messageText.trim() || !channelId) return;
    
    const content = messageText.trim();
    setMessageText('');
    
    try {
      await sendMessage({
        chatId: channelId,
        content,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!channelId) return;
    
    setIsSubscribing(true);
    try {
      await channelApi.subscribe(channelId);
      // Refresh channel info to update participant status
      const res = await channelApi.getInfo(channelId);
      setChannel(res.channel);
    } catch (error: any) {
      console.error('Failed to subscribe to channel:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender?._id === user?._id;
    
    return (
      <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
        <View style={[styles.messageBubble, isMyMessage && styles.myMessageBubble]}>
          {item.image && (
            <Text style={styles.messageText}>📷 Image</Text>
          )}
          {item.video && (
            <Text style={styles.messageText}>🎥 Video</Text>
          )}
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoadingChannel) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Channel</Text>
          </View>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading channel...</Text>
        </View>
      </View>
    );
  }

  if (!channel) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Channel</Text>
          </View>
        </View>
        <View style={styles.center}>
          <Text style={styles.messageText}>Channel not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{channel.name}</Text>
          <Text style={styles.headerSubtitle}>
            {isSubscribed ? `${channel.participants.length} subscriber${channel.participants.length !== 1 ? 's' : ''}` : 'Channel'}
          </Text>
        </View>
      </View>

      {/* Messages or Subscribe Prompt */}
      {!isSubscribed ? (
        <View style={styles.notSubscribedContainer}>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Subscribe to this channel</Text>
            <Text style={styles.emptyDescription}>
              Subscribe to get updates and view broadcasts from {channel.name}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.subscribeButton, isSubscribing && styles.sendButtonDisabled]}
            onPress={handleSubscribe}
            disabled={isSubscribing}
          >
            <Text style={styles.subscribeButtonText}>
              {isSubscribing ? 'Subscribing...' : 'Subscribe'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No broadcasts yet</Text>
              <Text style={styles.emptyDescription}>
                {isAdmin ? 'Send your first broadcast to subscribers' : 'No broadcasts in this channel yet'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.messagesList}
              scrollEnabled={true}
            />
          )}

          {/* Read-only notice for non-admins */}
          {!isAdmin && (
            <View style={styles.readOnlyNotice}>
              <Text style={styles.readOnlyText}>Only channel admins can post broadcasts</Text>
            </View>
          )}

          {/* Input Area - Only for Admins */}
          {isAdmin && (
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
              <View style={styles.inputContainer}>
                <TextInput
                  ref={(ref) => ref?.setNativeProps({ style: styles.input })}
                  style={styles.input}
                  placeholder="Broadcast a message..."
                  placeholderTextColor={colors.mutedForeground}
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  maxLength={1000}
                  editable={!isSendingMessage}
                />
                <TouchableOpacity 
                  style={[styles.sendButton, isSendingMessage && styles.sendButtonDisabled]}
                  onPress={handleSend}
                  disabled={isSendingMessage || !messageText.trim()}
                >
                  <Text style={styles.sendButtonText}>
                    {isSendingMessage ? '⏳' : '✓'}
                  </Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          )}
        </>
      )}
    </View>
  );
}
