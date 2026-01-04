import { Avatar } from '../../src/components/Avatar';
import DrawerToggle from '../../src/components/DrawerToggle';
import { Ionicons } from '@expo/vector-icons';
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
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import '../../global.css';
import { useThemeColors } from '../../src/utils/theme';
import { useChatStore } from '../../src/store/chatStore';
import { useAuthStore } from '../../src/store/authStore';
import { formatChatTime, getOtherUserAndGroup } from '../../src/utils/helpers';
import { channelApi } from '../../src/services/api/channel';
import apiClient from '../../src/services/api/client';

// Icons (using Unicode symbols for simplicity - you can replace with react-native-vector-icons if available)
const SearchIcon = () => <Text style={{ fontSize: 16, opacity: 0.5 }}>🔍</Text>;
const UserIcon = () => <Text style={{ fontSize: 20 }}>👤</Text>;
const GroupIcon = () => <Text style={{ fontSize: 20 }}>👥</Text>;
const ChannelIcon = () => <Text style={{ fontSize: 20 }}>📢</Text>;
const CommunityIcon = () => <Text style={{ fontSize: 20 }}>🏘️</Text>;
const StarIcon = () => <Text style={{ fontSize: 14 }}>⭐</Text>;
const CheckIcon = () => <Text style={{ fontSize: 12 }}>✓</Text>;
const BellIcon = ({ active }: { active?: boolean }) => (
  <Text style={{ fontSize: 16, opacity: active ? 1 : 0.5 }}>{active ? '🔔' : '🔕'}</Text>
);
const VerifiedIcon = () => <Text style={{ fontSize: 14 }}>✓</Text>;

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

const Home = () => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { user } = useAuthStore();
  const { chats, fetchChats, isChatsLoading } = useChatStore();
  
  const [channels, setChannels] = useState<ChannelType[]>([]);
  const [discoverChannels, setDiscoverChannels] = useState<ChannelType[]>([]);
  const [sponsoredChannels, setSponsoredChannels] = useState<ChannelType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showDiscover, setShowDiscover] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [loadingSponsored, setLoadingSponsored] = useState(false);
  const [subscribingChannels, setSubscribingChannels] = useState<Set<string>>(new Set());
  const [globalSearchResults, setGlobalSearchResults] = useState<{
    users: any[];
    channels: any[];
    communities: any[];
    groups: any[];
  }>({ users: [], channels: [], communities: [], groups: [] });
  const [isSearching, setIsSearching] = useState(false);
  
  // NEW: Error states
  const [searchError, setSearchError] = useState<string | null>(null);
  const [discoverError, setDiscoverError] = useState<string | null>(null);

  // Read route params to toggle Discover and prefill search
  const params = useLocalSearchParams<{ discover?: string | string[]; search?: string | string[]; q?: string | string[] }>();
  useEffect(() => {
    const discoverParam = Array.isArray(params.discover) ? params.discover[0] : params.discover;
    const searchParam = Array.isArray(params.search) ? params.search[0] : params.search;
    const qParam = Array.isArray(params.q) ? params.q[0] : params.q;

    if (discoverParam === '1' || searchParam === '1') {
      setShowDiscover(true);
    }
    if (typeof qParam === 'string' && qParam.length > 0) {
      setSearchQuery(qParam);
    }
  }, [params.discover, params.search, params.q]);
  const currentUserId = user?._id || null;

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchChats(),
        fetchUserChannels(),
        fetchSponsoredChannels(),
        fetchDiscoverChannels(),
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

  const fetchDiscoverChannels = async () => {
    // Always fetch if we don't have data, or if we want to refresh. 
    // Removing the early return allows retrying if it failed previously or if we want fresh data.
    // However, to prevent spamming, we can check loading state.
    if (loadingDiscover) return;
    
    setLoadingDiscover(true);
    setDiscoverError(null); // Reset error
    try {
      const response = await apiClient.get('/channel/public?limit=50');
      const publicChannels = (response.data.channels || []).filter(
        (channel: any) => channel.isPublic !== false
      );
      setDiscoverChannels(publicChannels);
    } catch (error: any) {
      console.log('Discover channels not available:', error?.response?.status);
      setDiscoverChannels([]);
      setDiscoverError('Failed to load discover channels. Please try again.'); // Set error
    } finally {
      setLoadingDiscover(false);
    }
  };

  const fetchSponsoredChannels = async () => {
    setLoadingSponsored(true);
    try {
      // Try to fetch featured channels first
      const response = await apiClient.get('/admin/channels/featured');
      const channels = (response.data.channels || []).slice(0, 2);
      setSponsoredChannels(channels);
    } catch (error: any) {
      // If featured endpoint doesn't exist (404) or fails, try recommended channels
      if (error?.response?.status === 404 || true) {
        try {
          const response = await apiClient.get('/channel/public?limit=2');
          const publicChannels = (response.data.channels || []).filter(
            (channel: any) => channel.isPublic !== false
          );
          setSponsoredChannels(publicChannels);
        } catch (fallbackError: any) {
          // If recommended also fails, silently fail - sponsored section will be hidden
          console.log('Sponsored channels not available');
          setSponsoredChannels([]);
        }
      }
    } finally {
      setLoadingSponsored(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSearchError(null); // Clear errors on refresh
    setDiscoverError(null);
    await loadData();
    setRefreshing(false);
  }, []);

  // Debounce search input to limit network calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keep Discover active and URL in sync while typing
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setShowDiscover(true);

      router.replace({
        pathname: '/',
        params: {
          discover: '1',
          q: searchQuery.trim(),
        },
      });
    }
  }, [searchQuery]);

  // Trigger global search only when Discover is active and query is long enough
  useEffect(() => {
    if (!showDiscover || debouncedSearchQuery.length < 2) {
      setGlobalSearchResults({ users: [], channels: [], communities: [], groups: [] });
      setIsSearching(false);
      return;
    }
    performGlobalSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, showDiscover]);

  // Fetch discover channels when tab is switched
  useEffect(() => {
    if (showDiscover && discoverChannels.length === 0) {
      fetchDiscoverChannels();
    }
  }, [showDiscover]);

  const performGlobalSearch = async (query: string) => {
    if (!showDiscover) return;
    
    setIsSearching(true);
    setSearchError(null); // Reset error
    try {
      // Call multiple endpoints in parallel to get different types of results
      const [usersRes, channelsRes, communitiesRes] = await Promise.allSettled([
        apiClient.get(`/user?search=${encodeURIComponent(query)}&limit=10`),
        apiClient.get(`/channel/public?search=${encodeURIComponent(query)}&limit=10`),
        apiClient.get(`/community?search=${encodeURIComponent(query)}&limit=10`),
      ]);

      // Extract results from successful requests
      const users = usersRes.status === 'fulfilled' ? (usersRes.value.data?.users || usersRes.value.data || []) : [];
      const channels = channelsRes.status === 'fulfilled' ? (channelsRes.value.data?.channels || channelsRes.value.data || []) : [];
      const communities = communitiesRes.status === 'fulfilled' ? (communitiesRes.value.data?.communities || communitiesRes.value.data || []) : [];
      
      // Filter out channels the user is already subscribed to
      const filteredChannels = (channels || []).filter(
        (ch: any) => !channels.some((userCh: any) => userCh._id === ch._id)
      );

      setGlobalSearchResults({
        users: Array.isArray(users) ? users : [],
        channels: Array.isArray(filteredChannels) ? filteredChannels : [],
        communities: Array.isArray(communities) ? communities : [],
        groups: [], // Groups are from local chats, not from global search
      });
      
      // If all failed, set error
      if (usersRes.status === 'rejected' && channelsRes.status === 'rejected' && communitiesRes.status === 'rejected') {
        setSearchError('Failed to perform search. Please try again.');
      }

    } catch (error: any) {
      console.log('Global search error:', error?.message);
      setGlobalSearchResults({ users: [], channels: [], communities: [], groups: [] });
      setSearchError('An unexpected error occurred during search.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleUnsubscribeFromChannel = async (channelId: string) => {
    setSubscribingChannels((prev) => new Set(prev).add(channelId));
    try {
      await apiClient.post(`/channel/${channelId}/unsubscribe`);
      
      // Remove from user's channels list (primary source of truth)
      setChannels((prev) => prev.filter((ch) => ch._id !== channelId));
      
      // Update discover channels list
      setDiscoverChannels((prev) =>
        prev.map((ch) => {
          if (ch._id === channelId) {
            return {
              ...ch,
              participants: (ch.participants || []).filter((p: any) => {
                const participantId = typeof p === 'string' ? p : p?._id;
                return participantId !== user?._id;
              }),
              subscriberCount: Math.max((ch.subscriberCount || 0) - 1, 0),
            };
          }
          return ch;
        })
      );
    } catch (error: any) {
      // Handle already unsubscribed case (400 error)
      if (error?.response?.status === 400) {
        console.warn('Already unsubscribed from channel:', error?.response?.data?.message);
        // Still update UI as user is not subscribed
        setChannels((prev) => prev.filter((ch) => ch._id !== channelId));
        setDiscoverChannels((prev) =>
          prev.map((ch) => {
            if (ch._id === channelId) {
              return {
                ...ch,
                participants: (ch.participants || []).filter((p: any) => {
                  const participantId = typeof p === 'string' ? p : p?._id;
                  return participantId !== user?._id;
                }),
                subscriberCount: Math.max((ch.subscriberCount || 0) - 1, 0),
              };
            }
            return ch;
          })
        );
      } else {
        console.error('Failed to unsubscribe:', error);
      }
    } finally {
      setSubscribingChannels((prev) => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
    }
  };

  const handleSubscribeToChannel = async (channelId: string) => {
    setSubscribingChannels((prev) => new Set(prev).add(channelId));
    try {
      const response = await apiClient.post(`/channel/${channelId}/subscribe`);
      console.log('Subscribe response:', response.data);
      
      // Refresh user channels from backend to ensure sync
      await fetchUserChannels();
      
      // Update discover channels list to show joined status
      setDiscoverChannels((prev) =>
        prev.map((ch) => {
          if (ch._id === channelId) {
            return {
              ...ch,
              participants: [...(ch.participants || []), user as any],
              subscriberCount: (ch.subscriberCount || 0) + 1,
            };
          }
          return ch;
        })
      );
    } catch (error: any) {
      console.error('Subscribe error:', error?.response?.data || error);
      // Handle already subscribed case (400 error)
      if (error?.response?.status === 400) {
        console.warn('Already subscribed to channel:', error?.response?.data?.message);
        // Refresh user channels to ensure sync
        await fetchUserChannels();
      } else {
        console.error('Failed to subscribe:', error?.message);
      }
    } finally {
      setSubscribingChannels((prev) => {
        const next = new Set(prev);
        next.delete(channelId);
        return next;
      });
    }
  };

  const isUserSubscribed = (channel: ChannelType): boolean => {
    // Check user's channels list first (primary source of truth)
    if (channels.some((ch) => ch._id === channel._id)) {
      return true;
    }
    
    // Fallback: check participants array in channel data
    // This handles cases where channel data might be stale
    return (
      Array.isArray(channel.participants) &&
      channel.participants.some((p: any) => {
        const participantId = typeof p === 'string' ? p : p?._id;
        return participantId === user?._id;
      })
    );
  };

  // Filter items based on search query
  const homeItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const safeTime = (entry: any) => {
      const ts = entry?.item?.lastMessage?.createdAt;
      return ts ? new Date(ts).getTime() : 0;
    };
    
    if (!q) {
      const items = [
        ...(chats || []).filter(Boolean).map((c) => ({ kind: 'chat' as const, item: c })),
        ...(channels || []).filter(Boolean).map((c) => ({ kind: 'channel' as const, item: c })),
      ].filter((entry) => entry?.item);
      
      return items.sort((a, b) => safeTime(b) - safeTime(a));
    }
    
    const searchTerm = q.startsWith('@') ? q.slice(1) : q;
    
    const matchedChats = (chats || [])
      .filter(Boolean)
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
    
    const merged = [...matchedChats, ...matchedChannels].filter((entry) => entry?.item);
    return merged.sort((a, b) => safeTime(b) - safeTime(a));
  }, [chats, channels, searchQuery]);

  const combinedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const cleanQuery = q.startsWith('@') ? q.slice(1) : q;

    const channels = (globalSearchResults.channels || []).map((c) => ({
      kind: 'channel' as const,
      item: c,
    }));

    const groups = (globalSearchResults.groups || []).map((g) => ({
      kind: 'chat' as const,
      item: g,
    }));

    const communities = (globalSearchResults.communities || []).map((c) => ({
      kind: 'community' as const,
      item: c,
    }));

    const privateChats = (chats || [])
      .filter((chat) => {
        if (chat.type === 'GROUP') return false;
        const name = (chat.name || chat.participants?.[0]?.name || '').toLowerCase();
        const username = (chat.participants?.[0]?.username || '').toLowerCase();
        return name.includes(cleanQuery) || username.includes(cleanQuery);
      })
      .map((c) => ({ kind: 'chat' as const, item: c }));

    const users = (globalSearchResults.users || []).map((u) => ({
      kind: 'user' as const,
      item: u,
    }));

    return [
      ...channels,
      ...groups,
      ...communities,
      ...privateChats,
      ...users,
    ].slice(0, 5);
  }, [searchQuery, globalSearchResults, chats]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: colors.background,
    },
    headerContent: {
      marginBottom: 0,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.foreground,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 0,
      borderWidth: 0,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: colors.foreground,
    },
    tabContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 0,
      paddingHorizontal: 0,
      backgroundColor: 'transparent',
    },
    tab: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.muted, // Default inactive background
      borderWidth: 0,
      alignItems: 'center',
      justifyContent: 'center',
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
    sponsoredSection: {
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.mutedForeground,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sponsoredCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
      borderWidth: 0,
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
      paddingHorizontal: 20,
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarImage: {
      width: 48,
      height: 48,
      borderRadius: 12,
    },
    onlineBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#10b981',
      borderWidth: 2,
      borderColor: colors.card,
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
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
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
    errorContainer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      color: 'red',
      textAlign: 'center',
      marginBottom: 10,
    },
  });

  const isDiscoverSearch = showDiscover && debouncedSearchQuery.length > 0;
  const displayItems = showDiscover ? (isDiscoverSearch ? combinedItems : []) : homeItems;
  const totalItems = displayItems.length;

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
          <View style={styles.avatar}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <UserIcon />
            )}
          </View>
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
          <View style={styles.avatar}>
            {channel.icon ? (
              <Image source={{ uri: channel.icon }} style={styles.avatarImage} />
            ) : (
              <ChannelIcon />
            )}
          </View>
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
          {showDiscover && (
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                isSubscribed && styles.subscribedButton,
              ]}
              onPress={() =>
                isSubscribed
                  ? handleUnsubscribeFromChannel(channel._id)
                  : handleSubscribeToChannel(channel._id)
              }
              disabled={isSubscribing}
            >
              <Text
                style={[
                  styles.subscribeButtonText,
                  isSubscribed && styles.subscribedButtonText,
                ]}
              >
                {isSubscribing ? '...' : isSubscribed ? 'Joined' : 'Join'}
              </Text>
            </TouchableOpacity>
          )}
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
            router.push(isGroup ? `/groups/${chat._id}` : `/chat/${chat._id}`)
          }
        >
          <View style={styles.avatar}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : isGroup ? (
              <GroupIcon />
            ) : (
              <UserIcon />
            )}
            {!isGroup && isOnline && <View style={styles.onlineBadge} />}
          </View>
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
          <View style={styles.avatar}>
            {community.icon ? (
              <Image source={{ uri: community.icon }} style={styles.avatarImage} />
            ) : (
              <CommunityIcon />
            )}
          </View>
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
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { outlineStyle: 'none' } as any]}
              placeholder="Search communities, channels, and groups..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              selectionColor={colors.primary}
              underlineColorAndroid="transparent"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <View style={{ marginLeft: 12 }}>
          </View>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, !showDiscover && styles.activeTab]}
            onPress={() => setShowDiscover(false)}
          >
            <Text
              style={[styles.tabText, !showDiscover && styles.activeTabText]}
            >
              Home
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, showDiscover && styles.activeTab]}
            onPress={() => setShowDiscover(true)}
          >
            <Text style={[styles.tabText, showDiscover && styles.activeTabText]}>
              Discover
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Sponsored Channels - only show if we have channels */}
        {/* commented out as requested */ false && sponsoredChannels.length > 0 && (
          <View style={styles.sponsoredSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <StarIcon />
              <Text style={[styles.sectionTitle, { marginLeft: 4, marginBottom: 0 }]}>
                Featured Channels
              </Text>
            </View>
            {sponsoredChannels.map((channel) => {
              const isSubscribed = isUserSubscribed(channel);
              const isSubscribing = subscribingChannels.has(channel._id);
              
              return (
                <TouchableOpacity
                  key={channel._id}
                  style={styles.sponsoredCard}
                  onPress={() => router.push(`/channel/${channel._id}`)}
                >
                  {channel.icon ? (
                    <Image
                      source={{ uri: channel.icon }}
                      style={styles.channelIconImage}
                    />
                  ) : (
                    <View style={styles.channelIcon}>
                      <ChannelIcon />
                    </View>
                  )}
                  <View style={styles.channelInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.channelName}>
                        {channel.groupName || channel.name}
                      </Text>
                      <View style={{ marginLeft: 4 }}>
                        <VerifiedIcon />
                      </View>
                    </View>
                    <Text style={styles.channelStats}>
                      {channel.subscriberCount || 0} subscribers
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.subscribeButton,
                      isSubscribed && styles.subscribedButton,
                    ]}
                    onPress={() =>
                      isSubscribed
                        ? handleUnsubscribeFromChannel(channel._id)
                        : handleSubscribeToChannel(channel._id)
                    }
                    disabled={isSubscribing}
                  >
                    <Text
                      style={[
                        styles.subscribeButtonText,
                        isSubscribed && styles.subscribedButtonText,
                      ]}
                    >
                      {isSubscribing ? '...' : isSubscribed ? 'Joined' : 'Join'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Content */}
        <View style={styles.listContainer}>
          {!showDiscover ? (
            // Home tab: local chats + channels
            isChatsLoading || loadingChannels ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : homeItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 48 }}>
                  {searchQuery.trim() ? '🔍' : '💬'}
                </Text>
                <Text style={styles.emptyText}>
                  {searchQuery.trim()
                    ? `No results found for "${searchQuery}"`
                    : 'No chats yet'}
                </Text>
                {searchQuery.trim() && (
                  <Text style={styles.emptySubtext}>
                    Try searching with different keywords
                  </Text>
                )}
              </View>
            ) : (
              <>
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Recent</Text>
                {homeItems.map(renderChatItem)}
              </>
            )
          ) : (
            // Discover tab
            <>
              {isDiscoverSearch ? (
                <>
                  <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Search Results</Text>
                  {isSearching ? (
                    <View style={styles.loader}>
                      <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                  ) : searchError ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{searchError}</Text>
                      <TouchableOpacity onPress={() => performGlobalSearch(debouncedSearchQuery)}>
                         <Ionicons name="refresh" size={24} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  ) : totalItems === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={{ fontSize: 48 }}>🔍</Text>
                      <Text style={styles.emptyText}>
                        {`No results found for "${searchQuery}"`}
                      </Text>
                    </View>
                  ) : (
                    displayItems.map(renderChatItem)
                  )}

                  {discoverChannels.length > 0 && (
                    <>
                      <Text style={[styles.sectionTitle, { marginTop: 24 }]}> 
                        Recommended Channels
                      </Text>
                      {discoverChannels.slice(0, 5).map((channel) =>
                        renderChatItem({ kind: 'channel', item: channel })
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Discover Channels</Text>
                  {loadingDiscover ? (
                    <View style={styles.loader}>
                      <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                  ) : discoverError ? (
                    <View style={styles.errorContainer}>
                       <Text style={styles.errorText}>{discoverError}</Text>
                       <TouchableOpacity onPress={fetchDiscoverChannels}>
                          <Text style={{ color: colors.primary }}>Try Again</Text>
                       </TouchableOpacity>
                    </View>
                  ) : discoverChannels.length === 0 ? (
                    <View style={[styles.emptyContainer, { paddingHorizontal: 16 }]}>
                      <View style={{
                        width: '100%',
                        backgroundColor: colors.card,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 20,
                        alignItems: 'center',
                      }}>
                        <Text style={{ fontSize: 48 }}>📢</Text>
                        <Text style={styles.emptyText}>No channels to discover yet</Text>
                        <Text style={styles.emptySubtext}>Pull to refresh or try again later</Text>
                        <TouchableOpacity
                          onPress={onRefresh}
                          style={{
                            marginTop: 16,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.card,
                          }}
                        >
                          <Text style={{ color: colors.foreground, fontWeight: '600' }}>Refresh</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    discoverChannels.map((channel) =>
                      renderChatItem({ kind: 'channel', item: channel })
                    )
                  )}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Home;
