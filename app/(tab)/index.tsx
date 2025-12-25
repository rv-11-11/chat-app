import { useMemo, useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import '../../global.css';
import { useThemeColors } from '../../src/utils/theme';
import { Avatar } from '../../src/components/Avatar';
import { useChatStore } from '../../src/store/chatStore';
import { useAuthStore } from '../../src/store/authStore';
import { formatChatTime, getOtherUserAndGroup } from '../../src/utils/helpers';
import { channelApi } from '../../src/services/api/channel';
import { chatApi } from '../../src/services/api/chat';
import { communityApi } from '../../src/services/api/community';
import apiClient from '../../src/services/api/client';
import { Ionicons } from '@expo/vector-icons';

interface ChannelType {
  _id: string;
  name?: string;
  groupName?: string;
  channelUsername?: string;
  icon?: string;
  isPublic?: boolean;
  subscriberCount?: number;
  lastMessage?: any;
  unreadCount?: number;
  participants?: any[];
}

const SearchIcon = () => {
  const colors = useThemeColors();
  return <Ionicons name="search-outline" size={20} color={colors.mutedForeground} />;
};

const UserIcon = () => {
  const colors = useThemeColors();
  return <Ionicons name="person" size={24} color={colors.mutedForeground} />;
};

const GroupIcon = () => {
  const colors = useThemeColors();
  return <Ionicons name="people" size={24} color={colors.mutedForeground} />;
};

const ChannelIcon = () => {
  const colors = useThemeColors();
  return <Ionicons name="megaphone-outline" size={24} color={colors.mutedForeground} />;
};

const CommunityIcon = () => {
  const colors = useThemeColors();
  return <Ionicons name="people-circle-outline" size={24} color={colors.mutedForeground} />;
};

const StarIcon = () => {
  return <Ionicons name="star" size={16} color="#eab308" />;
};

const VerifiedIcon = () => {
  const colors = useThemeColors();
  return <Ionicons name="checkmark-circle" size={16} color={colors.primary} />;
};

const Home = () => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { chats, fetchChats, isChatsLoading } = useChatStore();
  
  const [channels, setChannels] = useState<ChannelType[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [subscribingChannels, setSubscribingChannels] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<'all' | 'groups' | 'channels' | 'communities'>('all');
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; item: any | null }>({ visible: false, item: null });

  // Read route params to prefill search
  const params = useLocalSearchParams<{ search?: string | string[]; q?: string | string[] }>();
  useEffect(() => {
    const searchParam = Array.isArray(params.search) ? params.search[0] : params.search;
    const qParam = Array.isArray(params.q) ? params.q[0] : params.q;

    if (typeof qParam === 'string' && qParam.length > 0) {
      setSearchQuery(qParam);
    }
  }, [params.search, params.q]);
  const currentUserId = user?._id || null;

  const isUserSubscribed = useCallback((channel: ChannelType) => {
    if (!user) return false;
    return channel.participants?.some(p => (typeof p === 'string' ? p === user._id : p._id === user._id)) ?? false;
  }, [user]);

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchChats(),
        fetchUserChannels(),
        fetchUserCommunities(),
      ]);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const fetchUserChannels = async () => {
    setLoadingChannels(true);
    try {
      const response = await channelApi.getUserChannels();
      setChannels(response.channels || []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoadingChannels(false);
    }
  };

  const fetchUserCommunities = async () => {
    setLoadingCommunities(true);
    try {
      const response = await communityApi.getMyCommunities();
      setCommunities(response.communities || []);
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    } finally {
      setLoadingCommunities(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  // Filter items based on search query
  const homeItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const safeTime = (entry: any) => {
      const ts = entry?.item?.lastMessage?.createdAt || entry?.item?.updatedAt || entry?.item?.createdAt;
      return ts ? new Date(ts).getTime() : 0;
    };

    // Filter only Public Groups (Private groups are in Chats tab)
    const filterChats = (c: any) => {
        if (c.type === 'GROUP') {
             return c.isPublic !== false; 
        }
        return false;
    };
    
    if (!q) {
      let items: any[] = [];
      
      if (filterType === 'all' || filterType === 'groups') {
        items.push(...(chats || []).filter(filterChats).map((c) => ({ kind: 'chat' as const, item: c })));
      }
      
      if (filterType === 'all' || filterType === 'channels') {
        items.push(...(channels || []).filter(Boolean).map((c) => ({ kind: 'channel' as const, item: c })));
      }
      
      if (filterType === 'all' || filterType === 'communities') {
        items.push(...(communities || []).filter(Boolean).map((c) => ({ kind: 'community' as const, item: c })));
      }
      
      return items.sort((a, b) => safeTime(b) - safeTime(a));
    }
    
    const searchTerm = q.startsWith('@') ? q.slice(1) : q;
    
    const matchedChats = (chats || [])
      .filter(filterChats)
      .filter((chat) => {
        if (chat.type === 'GROUP') {
          const name = (chat.groupName || '').toLowerCase();
          return name.includes(searchTerm);
        } else {
          const name = (chat.participants?.[0]?.name || '').toLowerCase();
          return name.includes(searchTerm);
        }
      })
      .map((c) => ({ kind: 'chat' as const, item: c }));
    
    const matchedChannels = (channels || [])
      .filter(Boolean)
      .filter((ch) => {
        const name = (ch.groupName || ch.name || '').toLowerCase();
        const username = (ch.channelUsername || '').toLowerCase();
        return name.includes(searchTerm) || username.includes(searchTerm);
      })
      .map((c) => ({ kind: 'channel' as const, item: c }));
      
    const matchedCommunities = (communities || [])
      .filter(Boolean)
      .filter((c) => {
        const name = (c.name || '').toLowerCase();
        return name.includes(searchTerm);
      })
      .map((c) => ({ kind: 'community' as const, item: c }));
    
    const merged = [...matchedChats, ...matchedChannels, ...matchedCommunities];
    return merged.sort((a, b) => safeTime(b) - safeTime(a));
  }, [chats, channels, communities, searchQuery, filterType]);



  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    header: {
      padding: 16,
      paddingTop: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: colors.foreground,
    },
    tabContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: colors.muted,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.mutedForeground,
    },
    activeTabText: {
      color: colors.primaryForeground,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.mutedForeground,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    channelIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    channelIconImage: {
      width: 48,
      height: 48,
      borderRadius: 12,
    },
    channelInfo: {
      flex: 1,
      marginLeft: 12,
    },
    channelName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 2,
    },
    channelStats: {
      fontSize: 12,
      color: colors.mutedForeground,
    },
    subscribeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.primary,
    },
    subscribedButton: {
      backgroundColor: colors.muted,
    },
    subscribeButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primaryForeground,
    },
    subscribedButtonText: {
      color: colors.mutedForeground,
    },
    listContainer: {
      paddingHorizontal: 16,
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    chatInfo: {
      flex: 1,
      marginLeft: 12,
    },
    chatName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 4,
    },
    chatUsername: {
      fontSize: 12,
      color: colors.primary,
      marginBottom: 2,
    },
    lastMessage: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    chatMeta: {
      alignItems: 'flex-end',
      marginLeft: 12,
    },
    timestamp: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginBottom: 4,
    },
    unreadBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    unreadText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primaryForeground,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: colors.mutedForeground,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 8,
    },
    loader: {
      paddingVertical: 60,
    },
    actionButton: {
      padding: 8,
      marginLeft: 4,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 0,
      marginBottom: 12,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeFilterChip: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.foreground,
    },
    activeFilterChipText: {
      color: colors.primaryForeground,
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
    errorText: {
      color: '#ef4444',
      textAlign: 'center',
      marginBottom: 12,
    },
    retryButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.primary,
      borderRadius: 8,
      alignSelf: 'center',
    },
    retryButtonText: {
      color: colors.primaryForeground,
      fontWeight: '600',
    },
  });

  const handleAction = async (action: 'delete' | 'leave') => {
    const { item } = contextMenu;
    if (!item) return;

    setContextMenu({ visible: false, item: null });

    try {
      if (action === 'delete') {
        if (item.kind === 'chat') {
           await chatApi.deleteChat(item.item._id);
           await fetchChats(); 
        } else if (item.kind === 'channel') {
           await channelApi.delete(item.item._id);
           await fetchUserChannels();
        }
      } else if (action === 'leave') {
        if (item.kind === 'community') {
           await communityApi.leaveCommunity(item.item._id, user?._id || '');
           await fetchUserCommunities();
        } else if (item.kind === 'chat') {
           await chatApi.removeMember(item.item._id, user?._id || '');
           await fetchChats();
        } else if (item.kind === 'channel') {
           await channelApi.unsubscribe(item.item._id, user?._id || '');
           await fetchUserChannels();
        }
      }
    } catch (error) {
      console.error('Action failed', error);
      Alert.alert('Error', 'Failed to perform action');
    }
  };

  const confirmAction = (action: 'delete' | 'leave') => {
    const { item } = contextMenu;
    if (!item) return;
    
    let title = '';
    let message = '';
    
    if (action === 'delete') {
      if (item.kind === 'channel') {
        title = 'Delete Channel';
        message = 'Are you sure you want to delete this channel? This action cannot be undone.';
      } else {
        title = 'Delete Chat';
        message = 'Are you sure you want to delete this chat? This action cannot be undone.';
      }
    } else {
      if (item.kind === 'chat') {
        title = 'Leave Group';
        message = `Are you sure you want to leave this group?`;
      } else {
        title = item.kind === 'channel' ? 'Leave Channel' : 'Leave Community';
        message = `Are you sure you want to leave this ${item.kind}?`;
        if (item.kind === 'community') {
           message += ' You will lose access to all chats within this community.';
        }
      }
    }

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: action === 'delete' ? 'Delete' : 'Leave', style: 'destructive', onPress: () => handleAction(action) }
    ]);
  };

  const totalItems = homeItems.length;

  const displayItems = homeItems;

  const renderChatItem = (entry: any) => {
    if (entry.kind === 'user') {
      const user = entry.item;
      return (
        <TouchableOpacity
          key={user._id}
          style={styles.chatItem}
          onPress={async () => {
            try {
              const response = await apiClient.post('/chat/create', {
                participantId: user._id,
              });
              const chatId = response.data._id || response.data.chat?._id;
              if (chatId) {
                router.push(`/chat/${chatId}`);
              }
            } catch (error) {
              console.error('Failed to start chat:', error);
            }
          }}
        >
          <Avatar
            uri={user.avatar}
            name={user.name || 'U'}
            size={48}
            shape="rounded"
          />
          <View style={styles.chatInfo}>
            <Text style={styles.chatName}>{user.name || 'User'}</Text>
            {user.username && (
              <Text style={styles.chatUsername}>@{user.username}</Text>
            )}
          </View>
          <View style={styles.subscribeButton}>
            <Text style={styles.subscribeButtonText}>Message</Text>
          </View>
        </TouchableOpacity>
      );
    } else if (entry.kind === 'channel') {
      const channel = entry.item as ChannelType;
      const isSubscribed = isUserSubscribed(channel);
      const isSubscribing = subscribingChannels.has(channel._id);
      
      return (
        <TouchableOpacity
          key={channel._id}
          style={styles.chatItem}
          onPress={() => router.push(`/channel/${channel._id}`)}
        >
          <Avatar
            uri={channel.icon}
            name={channel.groupName || channel.name || 'C'}
            size={48}
            shape="rounded"
          />
          <View style={styles.chatInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.chatName}>
                {channel.groupName || channel.name || 'Channel'}
              </Text>
            </View>
            {channel.channelUsername && (
              <Text style={styles.chatUsername}>@{channel.channelUsername}</Text>
            )}
            <Text style={styles.lastMessage}>
              {channel.lastMessage?.content ||
                `${channel.subscriberCount || 0} subscribers`}
            </Text>
          </View>
          <View style={styles.chatMeta}>
            {channel.lastMessage?.createdAt && (
              <Text style={styles.timestamp}>
                {formatChatTime(channel.lastMessage.createdAt)}
              </Text>
            )}
            {channel.unreadCount !== undefined && channel.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {channel.unreadCount > 99 ? '99+' : channel.unreadCount}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={{ padding: 8 }}
            onPress={() => setContextMenu({ visible: true, item: entry })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="More options"
            accessibilityRole="button"
          >
             <Ionicons name="ellipsis-vertical" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    } else if (entry.kind === 'chat') {
      const chat = entry.item;
      const isGroup = chat.isGroup || chat.type === 'GROUP';
      const { name, avatar, isOnline } = getOtherUserAndGroup(chat, currentUserId);
      
      return (
        <TouchableOpacity
          key={chat._id}
          style={styles.chatItem}
          onPress={() =>
                router.push(`/chat/${chat._id}` as any)
              }
        >
          <Avatar
            uri={avatar}
            name={chat.name || chat.groupName || name || 'C'}
            size={48}
            shape="rounded"
            isOnline={!isGroup && isOnline}
            showStatus={!isGroup}
          />
          <View style={styles.chatInfo}>
            <Text style={styles.chatName}>
              {chat.name || chat.groupName || name || 'Chat'}
            </Text>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {chat.lastMessage?.content || 'No messages yet'}
            </Text>
          </View>
          <View style={styles.chatMeta}>
            {chat.lastMessage?.createdAt && (
              <Text style={styles.timestamp}>
                {formatChatTime(chat.lastMessage.createdAt)}
              </Text>
            )}
            {chat.unreadCount !== undefined && chat.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={{ padding: 8 }}
            onPress={() => setContextMenu({ visible: true, item: entry })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="More options"
            accessibilityRole="button"
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    } else if (entry.kind === 'community') {
      const community = entry.item;
      return (
        <TouchableOpacity
          key={community._id}
          style={styles.chatItem}
          onPress={() => router.push(`/community/${community._id}`)}
        >
          <Avatar
            uri={community.icon}
            name={community.name || 'C'}
            size={48}
            shape="rounded"
          />
          <View style={styles.chatInfo}>
            <Text style={styles.chatName}>{community.name || 'Community'}</Text>
            {community.username && (
              <Text style={styles.chatUsername}>@{community.username}</Text>
            )}
            <Text style={styles.lastMessage} numberOfLines={1}>
              {community.description || 'No description'}
            </Text>
          </View>
          <View style={styles.chatMeta}>
            <Text style={styles.timestamp}>
              {community.memberCount || community.members?.length || 0} members
            </Text>
          </View>
          <TouchableOpacity 
              style={{ padding: 8 }}
              onPress={() => setContextMenu({ visible: true, item: entry })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="More options"
              accessibilityRole="button"
            >
              <Ionicons name="ellipsis-vertical" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Home</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search communities, channels, and groups..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterContainer}
          style={{ flexGrow: 0 }}
        >
          {(['all', 'groups', 'channels', 'communities'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                filterType === type && styles.activeFilterChip
              ]}
              onPress={() => setFilterType(type)}
              accessibilityLabel={`Filter by ${type}`}
              accessibilityRole="button"
            >
              <Text style={[
                styles.filterChipText,
                filterType === type && styles.activeFilterChipText
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Content */}
        <View style={styles.listContainer}>
          {isChatsLoading || loadingChannels || loadingCommunities ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : totalItems === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 48 }}>
                {searchQuery.trim() ? '🔍' : '🏠'}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery.trim()
                  ? `No results found for "${searchQuery}"`
                  : 'Welcome to your Home!'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery.trim()
                  ? 'Try searching with different keywords'
                  : 'Join channels, groups, and communities to see them here.'}
              </Text>
              {!searchQuery.trim() && (
                 <TouchableOpacity 
                   style={[styles.retryButton, { marginTop: 20 }]} 
                   onPress={() => router.push('/discover')}
                 >
                   <Text style={styles.retryButtonText}>Go to Discover</Text>
                 </TouchableOpacity>
              )}
            </View>
          ) : (
            displayItems.map(renderChatItem)
          )}
        </View>
      </ScrollView>

      {/* Context Menu Modal */}
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
                {contextMenu.item?.kind === 'chat' && (() => {
                  const chat = contextMenu.item.item;
                  const isGroup = chat.isGroup || chat.type === 'GROUP';
                  
                  if (!isGroup) {
                    return (
                      <TouchableOpacity 
                        style={styles.menuItem}
                        onPress={() => confirmAction('delete')}
                      >
                        <Ionicons name="trash-outline" size={24} color="#ef4444" />
                        <Text style={[styles.menuItemText, styles.menuItemDestructive]}>Delete Chat</Text>
                      </TouchableOpacity>
                    );
                  }

                  const isOwner = chat.createdBy === user?._id || (typeof chat.createdBy === 'object' && (chat.createdBy as any)._id === user?._id);

                  return (
                    <>
                      {!isOwner && (
                         <TouchableOpacity 
                           style={styles.menuItem}
                           onPress={() => confirmAction('leave')}
                         >
                           <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                           <Text style={[styles.menuItemText, styles.menuItemDestructive]}>Leave Group</Text>
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

                {contextMenu.item?.kind === 'channel' && (() => {
                  const channel = contextMenu.item.item;
                  const isOwner = channel.createdBy === user?._id || (typeof channel.createdBy === 'object' && (channel.createdBy as any)._id === user?._id);
                  
                  return (
                    <>
                      {!isOwner && (
                        <TouchableOpacity 
                          style={styles.menuItem}
                          onPress={() => confirmAction('leave')}
                        >
                          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                          <Text style={[styles.menuItemText, styles.menuItemDestructive]}>Leave Channel</Text>
                        </TouchableOpacity>
                      )}
                      {isOwner && (
                        <TouchableOpacity 
                          style={styles.menuItem}
                          onPress={() => confirmAction('delete')}
                        >
                          <Ionicons name="trash-outline" size={24} color="#ef4444" />
                          <Text style={[styles.menuItemText, styles.menuItemDestructive]}>Delete Channel</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  );
                })()}

                {contextMenu.item?.kind === 'community' && (
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => confirmAction('leave')}
                  >
                    <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                    <Text style={[styles.menuItemText, styles.menuItemDestructive]}>Leave Community</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default Home;
