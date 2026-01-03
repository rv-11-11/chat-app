import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Modal, Alert, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import "../../global.css";
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore } from '../../src/store/chatStore';
import { useSocket } from '../../src/hooks/useSocket';
import { channelApi } from '../../src/services/api/channel';
import { useThemeColors } from '../../src/utils/theme';
import { formatMessageTime } from '../../src/utils/helpers';
import type { Message } from '../../src/types/chat.types';
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { Video, ResizeMode } from 'expo-av'
import { userApi } from '../../src/services/api/user';
import { Ionicons } from '@expo/vector-icons';
import { SmartImage } from '../../src/components/SmartImage';
import MediaPreviewModal from '../../src/components/MediaPreviewModal';
import { Avatar } from '../../src/components/Avatar';

interface Channel {
  _id: string;
  name?: string;
  groupName?: string;
  channelUsername?: string;
  channelDescription?: string;
  description?: string;
  icon?: string;
  admins: Array<string | { _id: string }>;
  participants: Array<string | { _id: string }>;
  createdBy?: string | { _id: string };
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{
    type: 'image' | 'video';
    uri: string;
    base64?: string | null;
    name?: string;
    mimeType?: string;
    size?: number;
  } | null>(null);
  
  // Member search state
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [processingUserIds, setProcessingUserIds] = useState<Set<string>>(new Set());

  const currentUserId = user?._id || null;
  const isOwner = useMemo(() => {
    if (!channel) return false;
    return (typeof channel.createdBy === 'string' ? channel.createdBy : channel.createdBy?._id)?.toString() === currentUserId?.toString();
  }, [channel, currentUserId]);

  const isAdmin = useMemo(() => {
    if (!channel) return false;
    return channel.admins.some((admin: string | { _id: string }) => 
      (typeof admin === 'string' ? admin : admin._id)?.toString() === currentUserId?.toString()
    ) || isOwner;
  }, [channel, currentUserId, isOwner]);

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
        setEditName(res.channel.name || res.channel.groupName || res.channel.channelUsername || '');
        setEditDescription(res.channel.description || res.channel.channelDescription || '');
        setEditIcon(res.channel.icon || '');
        setEditUsername(res.channel.channelUsername || res.channel.username || '');
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
      await sendMessage({ chatId: channelId, content });
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleSendMedia = async (caption: string) => {
    if (!previewMedia || !channelId) return;
    try {
      if (previewMedia.type === 'image') {
        let imageBase64 = previewMedia.base64;
        if (!imageBase64 && previewMedia.uri) {
          try {
            imageBase64 = await FileSystem.readAsStringAsync(previewMedia.uri, { encoding: FileSystem.EncodingType.Base64 });
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
          chatId: channelId,
          image: finalImage,
          content: caption.trim() || undefined,
        });
      } else {
        const base64Data = await FileSystem.readAsStringAsync(previewMedia.uri, { encoding: FileSystem.EncodingType.Base64 });
        const mimeType = previewMedia.mimeType || 'video/mp4';
        const finalData = `data:${mimeType};base64,${base64Data}`;
        await sendMessage({
          chatId: channelId,
          video: {
            data: finalData,
            name: previewMedia.name || 'video',
            type: mimeType,
            size: previewMedia.size || 0,
          },
          content: caption.trim() || undefined,
        });
      }
      setIsPreviewVisible(false);
      setPreviewMedia(null);
    } catch (error: any) {
      console.error('Failed to send media:', error);
      Alert.alert('Error', 'Failed to send media');
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
      Alert.alert('Success', 'You have joined the channel');
    } catch (error: any) {
      console.error('Failed to subscribe to channel:', error);
      Alert.alert('Error', 'Failed to join channel');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.5,
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (res.canceled || !res.assets?.[0] || !channelId) return;

      const asset = res.assets[0];
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
        Alert.alert('Error', 'Image too large. Maximum size is 5MB.');
        return;
      }

      let imageBase64 = asset.base64;
      if (!imageBase64 && asset.uri) {
        try {
          imageBase64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        } catch (readError) {
          console.error('Failed to read image as base64:', readError);
        }
      }

      if (!imageBase64) {
        Alert.alert('Error', 'Failed to process image');
        return;
      }

      // Ensure data URI prefix for Cloudinary
      const finalImage = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:image/jpeg;base64,${imageBase64}`;

      setPreviewMedia({
        type: 'image',
        uri: asset.uri,
        base64: finalImage,
      });
      setIsPreviewVisible(true);
    } catch (e) {
      console.error('Image pick failed:', e);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handlePickVideo = async () => {
    try {
      const res: any = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
      if ((res as any).canceled) return;
      const asset = (res as any).assets?.[0] || (res as any);
      if (!asset || !channelId) return;

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

  const handleUpdateChannel = async () => {
    if (!channel) return;
    setIsUpdating(true);
    try {
      await channelApi.update(channel._id, {
        name: editName,
        description: editDescription,
        icon: editIcon || undefined,
        username: editUsername || undefined,
      });
      const res = await channelApi.getInfo(channel._id);
      setChannel(res.channel);
      setSettingsOpen(false);
      Alert.alert('Success', 'Channel updated');
    } catch (error: any) {
      console.error('Update channel failed:', error);
      Alert.alert('Update failed', error?.response?.data?.message || 'Could not update channel');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLeaveChannel = async () => {
    if (!channel) return;
    Alert.alert('Leave channel', `Are you sure you want to leave ${channel.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          setIsSubscribing(true);
          try {
            await channelApi.unsubscribe(channel._id);
            const res = await channelApi.getInfo(channel._id);
            setChannel(res.channel);
            Alert.alert('Left', 'You left the channel');
          } catch (error: any) {
            Alert.alert('Leave failed', error?.response?.data?.message || 'Unable to leave channel');
          } finally {
            setIsSubscribing(false);
          }
        }
      }
    ]);
  };

  const handleDeleteChannel = async () => {
    if (!channel) return;
    Alert.alert('Delete channel', `This will permanently delete ${channel.name}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await channelApi.delete(channel._id);
            Alert.alert('Deleted', 'Channel deleted successfully');
            router.replace('/(tab)/channel');
          } catch (error: any) {
            Alert.alert('Delete failed', error?.response?.data?.message || 'Unable to delete channel');
          }
        }
      }
    ]);
  };

  const searchMembers = async (q: string) => {
    setMemberQuery(q);
    const query = q.trim();
    if (!query) { setMemberResults([]); return; }
    setIsSearchingMembers(true);
    try {
      const res = await userApi.searchUsers(query);
      setMemberResults(res.users || []);
    } catch (error) {
      console.error('Search members failed', error);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  const handleAddSubscriber = async (userId: string) => {
    if (!channel) return;
    try {
      await channelApi.addSubscriber(channel._id, userId);
      const res = await channelApi.getInfo(channel._id);
      setChannel(res.channel);
      Alert.alert('Added', 'Subscriber added');
    } catch (error: any) {
      Alert.alert('Add failed', error?.response?.data?.message || 'Unable to add subscriber');
    }
  };

  const handleRemoveSubscriber = async (userId: string) => {
    if (!channel) return;
    try {
      await channelApi.removeSubscriber(channel._id, userId);
      const res = await channelApi.getInfo(channel._id);
      setChannel(res.channel);
      Alert.alert('Removed', 'Subscriber removed');
    } catch (error: any) {
      Alert.alert('Remove failed', error?.response?.data?.message || 'Unable to remove subscriber');
    }
  };

  const handlePromoteAdmin = async (userId: string) => {
    if (!channel) return;
    try {
      await channelApi.addAdmin(channel._id, userId);
      const res = await channelApi.getInfo(channel._id);
      setChannel(res.channel);
      Alert.alert('Promoted', 'User promoted to admin');
    } catch (error: any) {
      Alert.alert('Promote failed', error?.response?.data?.message || 'Unable to promote');
    }
  };

  const handleDemoteAdmin = async (userId: string) => {
    if (!channel) return;
    try {
      await channelApi.removeAdmin(channel._id, userId);
      const res = await channelApi.getInfo(channel._id);
      setChannel(res.channel);
      Alert.alert('Demoted', 'Admin removed');
    } catch (error: any) {
      Alert.alert('Demote failed', error?.response?.data?.message || 'Unable to demote');
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { 
      flex: 1,
      backgroundColor: colors.background,
    },
    center: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    backButton: { 
      padding: 8, 
      marginRight: 8 
    },
    backButtonText: { 
      fontSize: 24, 
      fontWeight: '600',
      color: colors.foreground
    },
    headerInfo: { 
      flex: 1 
    },
    headerTitle: { 
      fontSize: 18, 
      fontWeight: '700',
      color: colors.foreground
    },
    headerSubtitle: { 
      fontSize: 12, 
      color: colors.mutedForeground 
    },
    headerActions: { 
      flexDirection: 'row', 
      gap: 12 
    },
    actionButton: { 
      padding: 8 
    },
    actionButtonText: { 
      fontSize: 20 
    },
    loadingText: { 
      marginTop: 12, 
      fontSize: 14, 
      color: colors.mutedForeground 
    },
    messageText: { 
      fontSize: 16,
      color: colors.foreground
    },
    notSubscribedContainer: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 24 
    },
    emptyContainer: { 
      alignItems: 'center', 
      marginBottom: 24 
    },
    emptyTitle: { 
      fontSize: 20, 
      fontWeight: '700', 
      marginBottom: 8,
      color: colors.foreground
    },
    emptyDescription: { 
      fontSize: 14, 
      color: colors.mutedForeground, 
      textAlign: 'center' 
    },
    subscribeButton: { 
      backgroundColor: colors.primary, 
      paddingHorizontal: 32, 
      paddingVertical: 14, 
      borderRadius: 30 
    },
    subscribeButtonText: { 
      color: colors.primaryForeground, 
      fontWeight: '700', 
      fontSize: 16 
    },
    sendButtonDisabled: { 
      opacity: 0.5 
    },
    messagesList: { 
      padding: 16, 
      paddingBottom: 100 
    },
    readOnlyNotice: { 
      padding: 12, 
      backgroundColor: colors.muted, 
      alignItems: 'center' 
    },
    readOnlyText: { 
      color: colors.mutedForeground, 
      fontSize: 12 
    },
    inputContainer: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      padding: 12, 
      borderTopWidth: 0.5, 
      borderTopColor: colors.border, 
      backgroundColor: colors.card,
      paddingBottom: insets.bottom || 12
    },
    mediaButton: { 
      padding: 10 
    },
    mediaButtonText: { 
      fontSize: 20 
    },
    input: { 
      flex: 1, 
      maxHeight: 100, 
      borderRadius: 20, 
      backgroundColor: colors.muted, 
      paddingHorizontal: 16, 
      paddingVertical: 8, 
      marginHorizontal: 8, 
      fontSize: 16,
      color: colors.foreground
    },
    sendButton: { 
      padding: 10, 
      backgroundColor: colors.primary, 
      borderRadius: 20 
    },
    sendButtonText: { 
      color: colors.primaryForeground, 
      fontSize: 16, 
      fontWeight: '700' 
    },
    messageContainer: { 
      marginBottom: 12, 
      flexDirection: 'row' 
    },
    myMessageContainer: { 
      justifyContent: 'flex-end' 
    },
    messageBubble: { 
      maxWidth: '80%', 
      padding: 12, 
      borderRadius: 16, 
      backgroundColor: colors.muted 
    },
    myMessageBubble: { 
      backgroundColor: colors.primary 
    },
    myMessageText: { 
      color: colors.primaryForeground 
    },
    replyPreview: { 
      padding: 8, 
      backgroundColor: 'rgba(0,0,0,0.05)', 
      borderRadius: 8, 
      marginBottom: 8, 
      borderLeftWidth: 2, 
      borderLeftColor: colors.primary 
    },
    replyText: { 
      fontSize: 12, 
      color: colors.mutedForeground 
    },
    mediaContainer: { 
      marginBottom: 8, 
      borderRadius: 12, 
      overflow: 'hidden' 
    },
    mediaImage: { 
      width: 200, 
      height: 200 
    },
    mediaVideo: { 
      width: 200, 
      height: 200 
    },
    pendingCard: {
      marginHorizontal: 12,
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card
    },
    pendingLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 8
    },
    pendingPreview: {
      width: '100%',
      height: 220,
      borderRadius: 10,
      marginBottom: 10
    },
    pendingActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end'
    },
    pendingButton: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10
    },
    pendingCancel: {
      backgroundColor: colors.muted
    },
    pendingCancelText: {
      color: colors.foreground,
      fontWeight: '600'
    },
    pendingSend: {
      backgroundColor: colors.primary,
      marginLeft: 8
    },
    pendingSendText: {
      color: colors.primaryForeground,
      fontWeight: '700'
    },
    mediaIndicator: { 
      fontSize: 12, 
      color: colors.mutedForeground, 
      marginBottom: 4 
    },
    messageTime: { 
      fontSize: 10, 
      color: colors.mutedForeground, 
      alignSelf: 'flex-end', 
      marginTop: 4 
    },
    myMessageTime: { 
      color: 'rgba(255,255,255,0.7)' 
    },
  }), [colors]);

  const renderRichText = (text: string) => {
    // Regex matches:
    // 1. http:// or https:// or www. followed by non-whitespace
    // 2. Domain-like patterns (something.com, etc.)
    const urlRegex = /((?:https?:\/\/|www\.)[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]+\.(?:com|net|org|edu|gov|io|co|in|biz|info|me|app|dev)(?:\/[^\s]*)?)/gi;
    const parts = text.split(urlRegex);
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <Text
            key={index}
            style={{ color: '#0000EE', textDecorationLine: 'underline', fontWeight: 'bold' }}
            onPress={() => {
              let url = part;
              if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
              }
              Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
            }}
          >
            {part}
          </Text>
        );
      }
      
      // Parse Bold *text*
      const boldParts = part.split(/\*([^*]+)\*/g);
      return boldParts.map((subPart, subIndex) => {
        if (subIndex % 2 === 1) { // Matched group
           return <Text key={`${index}-${subIndex}`} style={{ fontWeight: 'bold' }}>{subPart}</Text>;
        }
        
        // Parse Italic _text_
        const italicParts = subPart.split(/_([^_]+)_/g);
        return italicParts.map((subSubPart, subSubIndex) => {
            if (subSubIndex % 2 === 1) {
                return <Text key={`${index}-${subIndex}-${subSubIndex}`} style={{ fontStyle: 'italic' }}>{subSubPart}</Text>;
            }
            return <Text key={`${index}-${subIndex}-${subSubIndex}`}>{subSubPart}</Text>;
        });
      });
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
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
              <SmartImage source={imageSrc} style={styles.mediaImage} contentFit="cover" />
            </View>
          )}

          {videoUri && (
            <View style={styles.mediaContainer}>
              <Video
                source={{ uri: videoUri }}
                style={styles.mediaVideo}
                resizeMode={Platform.OS === 'web' ? ResizeMode.CONTAIN : ResizeMode.COVER}
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
              {renderRichText(item.content)}
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 2, gap: 4 }}>
            <Text style={[styles.messageTime, isMyMessage && styles.myMessageTime]}>
              {formatMessageTime(item.createdAt)}
            </Text>
            {isMyMessage && (
               <Ionicons name="checkmark-done" size={14} color={styles.myMessageTime.color} />
            )}
            <TouchableOpacity hitSlop={10} onPress={() => handleMessageOptions(item)}>
              <Ionicons name="ellipsis-vertical" size={14} color={isMyMessage ? 'rgba(255,255,255,0.7)' : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
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
    <SafeAreaView style={styles.container} edges={["top", "bottom", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Avatar
          uri={channel.icon}
          name={channel.name || channel.groupName || channel.channelUsername || 'C'}
          size={40}
          style={{ marginRight: 12 }}
          shape="rounded"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{channel.name || channel.groupName || channel.channelUsername || 'Channel'}</Text>
          <Text style={styles.headerSubtitle}>
            {isSubscribed ? `${channel.participants.length} subscriber${channel.participants.length !== 1 ? 's' : ''}` : 'Channel'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/')}
          >
            <Ionicons name="search" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setSettingsOpen(true)}
          >
             <Ionicons name="settings-outline" size={24} color={colors.foreground} />
          </TouchableOpacity>
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
              data={messages.filter(m => m.messageType !== 'SYSTEM')}
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
                <TouchableOpacity style={styles.mediaButton} onPress={handlePickImage} disabled={isSendingMessage}>
                  <Ionicons name="image-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaButton} onPress={handlePickVideo} disabled={isSendingMessage}>
                  <Ionicons name="videocam-outline" size={24} color={colors.primary} />
                </TouchableOpacity>
                <TextInput
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
                  <Ionicons name="send" size={20} color={colors.primaryForeground} />
                </TouchableOpacity>
              </View>
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
          )}
        </>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <Modal transparent animationType="fade" visible={settingsOpen} onRequestClose={() => setSettingsOpen(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
            <View style={{ backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', maxHeight: '80%' }}>
              <View style={{ padding: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>Channel Settings</Text>
                <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>Manage profile, members and actions</Text>
              </View>

              <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
                {/* Profile edit */}
                <View style={{ gap: 8 }}>
                  <Text style={{ color: colors.mutedForeground, fontWeight: '600' }}>Profile</Text>
                  {isAdmin ? (
                    <>
                      <TextInput style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground }} placeholder="Name" placeholderTextColor={colors.mutedForeground} value={editName} onChangeText={setEditName} />
                      <TextInput style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground }} placeholder="Description" placeholderTextColor={colors.mutedForeground} value={editDescription} onChangeText={setEditDescription} multiline />
                      <TextInput style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground }} placeholder="Username (optional)" placeholderTextColor={colors.mutedForeground} value={editUsername} onChangeText={setEditUsername} />
                      <TextInput style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground }} placeholder="Icon URL (optional)" placeholderTextColor={colors.mutedForeground} value={editIcon} onChangeText={setEditIcon} />
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, flex: 1, alignItems: 'center' }} onPress={handleUpdateChannel} disabled={isUpdating}>
                          <Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>{isUpdating ? 'Saving...' : 'Save'}</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <View style={{ padding: 12, backgroundColor: colors.muted, borderRadius: 10 }}>
                       <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 4 }}>{channel?.name || channel?.groupName || channel?.channelUsername}</Text>
                       {channel?.description || channel?.channelDescription ? (
                         <Text style={{ color: colors.mutedForeground }}>{channel.description || channel.channelDescription}</Text>
                       ) : (
                         <Text style={{ color: colors.mutedForeground, fontStyle: 'italic' }}>No description</Text>
                       )}
                     </View>
                  )}
                </View>

                  {/* Members overview */}
                <View style={{ gap: 6 }}>
                  <Text style={{ color: colors.mutedForeground, fontWeight: '600' }}>Members</Text>
                  <Text style={{ color: colors.mutedForeground }}>{(channel?.participants || []).length} subscribers • {Array.isArray(channel?.admins) ? channel!.admins.length : 0} admins</Text>
                  
                  {/* Notification Preferences */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                    <Text style={{ color: colors.foreground, fontSize: 16 }}>Notifications</Text>
                    <TouchableOpacity 
                      onPress={() => Alert.alert('Notifications', 'Notification settings updated')}
                      style={{ backgroundColor: colors.muted, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
                    >
                      <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>On</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Admin-only actions */}
                  {isAdmin && (
                    <View style={{ gap: 8 }}>
                      <Text style={{ color: colors.mutedForeground, fontWeight: '600' }}>Manage Members</Text>
                      <TextInput
                        placeholder="Search by name or @username"
                        placeholderTextColor={colors.mutedForeground}
                        value={memberQuery}
                        onChangeText={searchMembers}
                        style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.foreground }}
                      />
                      {isSearchingMembers ? (
                        <View style={{ paddingVertical: 10 }}>
                          <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                      ) : (
                        memberResults.length > 0 && (
                          <View style={{ gap: 6 }}>
                            {memberResults.map((u: any) => {
                              const uid = (u._id || u.id || '').toString();
                              const isSub = (channel?.participants || []).some((p: any) => ((typeof p === 'string' ? p : p?._id)?.toString()) === uid);
                              const isAdm = (channel?.admins || []).some((a: any) => ((typeof a === 'string' ? a : a?._id)?.toString()) === uid);
                              const processing = processingUserIds.has(uid);
                              return (
                                <View key={`search-${uid}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Avatar
                                      uri={u.avatar}
                                      name={u.username || u.name || 'U'}
                                      size={32}
                                    />
                                    <View>
                                      <Text style={{ color: colors.foreground, fontWeight: '600' }}>{u.name || u.username}</Text>
                                      {u.username && <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>@{u.username}</Text>}
                                    </View>
                                  </View>
                                  <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {!isSub && (
                                      <TouchableOpacity disabled={processing} onPress={async () => { setProcessingUserIds(prev => new Set(prev).add(uid)); await handleAddSubscriber(uid); setProcessingUserIds(prev => { const n = new Set(prev); n.delete(uid); return n; }); }} style={{ backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                                        <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>{processing ? '...' : 'Add'}</Text>
                                      </TouchableOpacity>
                                    )}
                                    {isSub && !isAdm && (
                                      <TouchableOpacity disabled={processing} onPress={async () => { setProcessingUserIds(prev => new Set(prev).add(uid)); await handlePromoteAdmin(uid); setProcessingUserIds(prev => { const n = new Set(prev); n.delete(uid); return n; }); }} style={{ backgroundColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                                        <Text style={{ color: colors.foreground, fontWeight: '600' }}>{processing ? '...' : 'Promote'}</Text>
                                      </TouchableOpacity>
                                    )}
                                    {isSub && (
                                      <TouchableOpacity disabled={processing} onPress={async () => { setProcessingUserIds(prev => new Set(prev).add(uid)); await handleRemoveSubscriber(uid); setProcessingUserIds(prev => { const n = new Set(prev); n.delete(uid); return n; }); }} style={{ backgroundColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                                        <Text style={{ color: colors.foreground, fontWeight: '600' }}>{processing ? '...' : 'Remove'}</Text>
                                      </TouchableOpacity>
                                    )}
                                    {isAdm && (
                                      <TouchableOpacity disabled={processing} onPress={async () => { setProcessingUserIds(prev => new Set(prev).add(uid)); await handleDemoteAdmin(uid); setProcessingUserIds(prev => { const n = new Set(prev); n.delete(uid); return n; }); }} style={{ backgroundColor: '#eab308', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                                        <Text style={{ color: '#000', fontWeight: '700' }}>{processing ? '...' : 'Demote'}</Text>
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        )
                      )}

                      {/* Current Members */}
                      <Text style={{ color: colors.mutedForeground, fontWeight: '600', marginTop: 8 }}>Current subscribers</Text>
                      <View style={{ gap: 6 }}>
                        {(channel?.participants || []).map((p: any) => {
                          const pid = (typeof p === 'string' ? p : p?._id)?.toString();
                          const displayName = (typeof p === 'object' && (p.name || p.username)) ? (p.name || p.username) : 'User';
                          const isAdm = (channel?.admins || []).some((a: any) => ((typeof a === 'string' ? a : a?._id)?.toString()) === pid);
                          const processing = processingUserIds.has(pid!);
                          return (
                            <View key={`sub-${pid}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Avatar
                                  uri={typeof p === 'object' ? p.avatar : undefined}
                                  name={displayName}
                                  size={28}
                                />
                                <View>
                                  <Text style={{ color: colors.foreground }}>{displayName}</Text>
                                  {typeof p === 'object' && p.username && <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>@{p.username}</Text>}
                                </View>
                              </View>
                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                {!isAdm && (
                                  <TouchableOpacity disabled={processing} onPress={async () => { setProcessingUserIds(prev => new Set(prev).add(pid!)); await handlePromoteAdmin(pid!); setProcessingUserIds(prev => { const n = new Set(prev); n.delete(pid!); return n; }); }} style={{ backgroundColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                                    <Text style={{ color: colors.foreground, fontWeight: '600' }}>{processing ? '...' : 'Promote'}</Text>
                                  </TouchableOpacity>
                                )}
                                <TouchableOpacity disabled={processing} onPress={async () => { setProcessingUserIds(prev => new Set(prev).add(pid!)); await handleRemoveSubscriber(pid!); setProcessingUserIds(prev => { const n = new Set(prev); n.delete(pid!); return n; }); }} style={{ backgroundColor: colors.muted, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                                  <Text style={{ color: colors.foreground, fontWeight: '600' }}>{processing ? '...' : 'Remove'}</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </View>

                      {/* Admins */}
                      <Text style={{ color: colors.mutedForeground, fontWeight: '600', marginTop: 8 }}>Admins</Text>
                      <View style={{ gap: 6 }}>
                        {(channel?.admins || []).map((a: any) => {
                          const aid = (typeof a === 'string' ? a : a?._id)?.toString();
                          const displayName = (typeof a === 'object' && (a.name || a.username)) ? (a.name || a.username) : 'Admin';
                          const processing = processingUserIds.has(aid!);
                          const isSelf = aid === (user?._id || '').toString();
                          return (
                            <View key={`adm-${aid}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Avatar
                                  uri={typeof a === 'object' ? a.avatar : undefined}
                                  name={displayName}
                                  size={28}
                                />
                                <View>
                                  <Text style={{ color: colors.foreground }}>{displayName}</Text>
                                  {typeof a === 'object' && a.username && <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>@{a.username}</Text>}
                                </View>
                              </View>
                              {!isSelf && (
                                <TouchableOpacity disabled={processing} onPress={async () => { setProcessingUserIds(prev => new Set(prev).add(aid!)); await handleDemoteAdmin(aid!); setProcessingUserIds(prev => { const n = new Set(prev); n.delete(aid!); return n; }); }} style={{ backgroundColor: '#eab308', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
                                  <Text style={{ color: '#000', fontWeight: '700' }}>{processing ? '...' : 'Demote'}</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                {/* Leave/Delete Button */}
                {isOwner ? (
                  <TouchableOpacity 
                    style={{ backgroundColor: '#fee2e2', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 20 }} 
                    onPress={handleDeleteChannel}
                  >
                    <Text style={{ color: '#ef4444', fontWeight: '700' }}>Delete Channel</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={{ backgroundColor: colors.primary + '20', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 20 }} 
                    onPress={handleLeaveChannel}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>Leave Channel</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 0.5, borderTopColor: colors.border }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: colors.muted, borderRadius: 10, paddingVertical: 10, alignItems: 'center' }} onPress={() => setSettingsOpen(false)}>
                  <Text style={{ color: colors.foreground, fontWeight: '600' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
