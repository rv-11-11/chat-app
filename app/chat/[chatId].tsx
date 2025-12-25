import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GroupDetailsModal from '../../src/components/GroupDetailsModal';
import MediaPreviewModal from '../../src/components/MediaPreviewModal';
import { SmartImage } from '../../src/components/SmartImage';
import { Avatar } from '../../src/components/Avatar';
import { useSocket } from '../../src/hooks/useSocket';
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore } from '../../src/store/chatStore';
import { useSocketStore } from '../../src/store/socketStore';
import type { Message } from '../../src/types/chat.types';
import { formatMessageTime, getOtherUserAndGroup } from '../../src/utils/helpers';
import { useThemeColors } from '../../src/utils/theme';
import { chatApi } from '../../src/services/api/chat';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Video } from 'expo-av'

const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { currentChat, messages, fetchChat, sendMessage, addNewMessage, removeMessage, isSendingMessage, markAsRead } = useChatStore();
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const { socket } = useSocket({});
  const router = useRouter();
  const [messageText, setMessageText] = useState('');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const colors = useThemeColors();
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ 
    type: 'image' | 'video'; 
    uri: string; 
    base64?: string | null; 
    name?: string; 
    mimeType?: string; 
    size?: number; 
    width?: number; 
    height?: number; 
  } | null>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: insets.top },
    header: { flexDirection: 'row', 
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
      elevation: 3 },
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
    mediaContainer: { marginTop: 8, backgroundColor: '#0b0b0b', borderRadius: 14, overflow: 'hidden' },
    mediaImage: { width: 260, height: 260 },
    mediaVideo: { width: 260, height: 260 },
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
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: -2 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 4, 
      elevation: 2,
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
    typingIndicator: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', gap: 8 },
    typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
    typingText: { fontSize: 13, color: colors.mutedForeground, marginLeft: 4, fontWeight: '500' },
    systemMessageContainer: {
      alignItems: 'center',
      marginVertical: 8,
      paddingHorizontal: 16,
    },
    systemMessageText: {
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: 'center',
      backgroundColor: colors.muted,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 10,
      overflow: 'hidden',
    },
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

  const handleLeaveGroup = async () => {
    if (!currentChat) return;
    Alert.alert('Leave Group', `Are you sure you want to leave ${currentChat.groupName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Leave', 
        style: 'destructive', 
        onPress: async () => { 
          try { 
            await chatApi.removeMember(currentChat._id, user?._id as string); 
            fetchChats(); 
            router.replace('/(tab)'); 
          } catch (err: any) { 
            Alert.alert('Error', err.response?.data?.message || 'Failed to leave group'); 
          }
        } 
      }
    ]);
  };

  const handleDeleteChat = async () => {
     if (!currentChat) return;
     Alert.alert('Delete Chat', 'Permanently delete this conversation?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => { 
           try { 
             await chatApi.deleteChat(currentChat._id); 
             fetchChats(); 
             router.replace('/(tab)'); 
           } catch (e) { 
             Alert.alert('Error', 'Failed to delete chat'); 
           } 
        } }
     ]);
  };

  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.5,
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (res.canceled || !res.assets?.[0] || !chatId) return;

      const asset = res.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Error', 'Image too large. Maximum size is 5MB.');
        return;
      }

      setPreviewMedia({
        type: 'image',
        uri: asset.uri,
        base64: asset.base64,
        width: asset.width,
        height: asset.height
      });
      setIsPreviewVisible(true);
    } catch (e) {
      console.error('Image pick failed:', e);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handlePickVideo = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
      
      if (res.canceled) return;
      
      const asset = res.assets[0];
      if (!asset || !chatId) return;

      if (asset.size && asset.size > MAX_VIDEO_SIZE) {
        Alert.alert('Error', 'Video too large. Maximum size is 50MB.');
        return;
      }

      setPreviewMedia({
        type: 'video',
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size
      });
      setIsPreviewVisible(true);
    } catch (e) {
      console.error('Video pick failed:', e);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  const handleSendMedia = async (caption: string) => {
    if (!previewMedia || !chatId) return;
    
    try {
      if (previewMedia.type === 'image') {
        let imageBase64 = previewMedia.base64;
        if (!imageBase64 && previewMedia.uri) {
           try {
             imageBase64 = await FileSystem.readAsStringAsync(previewMedia.uri, { encoding: 'base64' });
           } catch (readError) {
             console.error('Failed to read image as base64:', readError);
           }
        }
        
        if (!imageBase64) {
          Alert.alert('Error', 'Failed to process image');
          return;
        }

        const finalImage = imageBase64.startsWith('data:') 
          ? imageBase64 
          : `data:image/jpeg;base64,${imageBase64}`;

        await sendMessage({ 
            chatId, 
            image: finalImage,
            content: caption.trim() || undefined 
        });
      } else {
        // Video
        const base64Data = await FileSystem.readAsStringAsync(previewMedia.uri, { encoding: 'base64' });
        const mimeType = previewMedia.mimeType || 'video/mp4';
        const finalData = `data:${mimeType};base64,${base64Data}`;

        await sendMessage({
          chatId,
          video: { 
            data: finalData, 
            name: previewMedia.name || 'video', 
            type: mimeType, 
            size: previewMedia.size || 0 
          },
          content: caption.trim() || undefined
        });
      }
      
      setIsPreviewVisible(false);
      setPreviewMedia(null);
    } catch (error: any) {
       console.error('Failed to send media:', error);
       if (error.response) {
         console.error('Error response:', error.response.status, error.response.data);
       }
       Alert.alert('Error', 'Failed to send media. Please try again.');
    }
  };

  const getTypingText = () => {
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return 'Someone is typing...';
    if (typingUsers.length === 2) return '2 people are typing...';
    return `${typingUsers.length} people are typing...`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.messageType === 'SYSTEM') {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>
            {item.content}
          </Text>
        </View>
      );
    }

    const isMyMessage = item.sender?._id === user?._id;
    const imageSrc = item.image
      ? (item.image.startsWith('http') ? { uri: item.image } : { uri: `data:image/jpeg;base64,${item.image}` })
      : null;
    const videoUri = item.video?.url || null;
    
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
          {imageSrc && (
            <View style={styles.mediaContainer}>
              <SmartImage 
                source={imageSrc} 
                style={styles.mediaImage} 
                contentFit="cover" 
                showLoadingIndicator={true}
              />
            </View>
          )}
          {videoUri && (
            <View style={styles.mediaContainer}>
              <Video
                source={{ uri: videoUri }}
                style={styles.mediaVideo}
                resizeMode={Platform.OS === 'web' ? 'contain' : 'cover'}
                useNativeControls
                shouldPlay={false}
                isLooping={false}
              />
            </View>
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
      style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Avatar
          uri={getChatAvatar() || undefined}
          name={getChatName()}
          size={40}
          style={{ marginRight: 10 }}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {getChatName()}
          </Text>
          <Text style={styles.headerSubtitle}>
            {getChatOnlineStatus() ? 'Online' : 'Offline'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            if (currentChat?.isGroup) {
              setIsGroupModalOpen(true);
            } else {
              Alert.alert('Options', undefined, [
                { text: 'Delete Chat', style: 'destructive', onPress: handleDeleteChat },
                { text: 'Cancel', style: 'cancel' }
              ]);
            }
          }} 
          style={{ padding: 8 }}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        ListFooterComponent={
          typingUsers.length > 0 ? (
            <View style={styles.typingIndicator}>
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <View style={styles.typingDot} />
              <Text style={styles.typingText}>{getTypingText()}</Text>
            </View>
          ) : null
        }
      />
      
      <View style={styles.inputContainer}>
        <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 22, backgroundColor: colors.muted }} onPress={handlePickImage}>
          <Text style={{ fontSize: 18, color: colors.foreground }}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 22, backgroundColor: colors.muted }} onPress={handlePickVideo}>
          <Text style={{ fontSize: 18, color: colors.foreground }}>🎥</Text>
        </TouchableOpacity>
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
      
      <MediaPreviewModal
        visible={isPreviewVisible}
        onClose={() => {
          setIsPreviewVisible(false);
          setPreviewMedia(null);
        }}
        onSend={handleSendMedia}
        media={previewMedia}
        isSending={isSendingMessage}
      />
    </KeyboardAvoidingView>
  );
}



