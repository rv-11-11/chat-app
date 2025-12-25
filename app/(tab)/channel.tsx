import { useEffect, useState, useCallback, useRef } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, TextInput, LayoutAnimation, Alert, Animated, Platform, UIManager, Modal, TouchableWithoutFeedback } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import "../../global.css";
import ChannelCreateModal from '../../src/components/ChannelCreateModal';
import { channelApi } from '../../src/services/api/channel';
import { useThemeColors } from '../../src/utils/theme';
import { Chat } from '../../src/types/chat.types';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../src/components/Avatar';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const ChannelItem = ({ 
  item, 
  index, 
  activeTab, 
  myChannels, 
  user, 
  colors, 
  router, 
  styles,
  onJoin, 
  onMenuPress 
}: any) => {
  const isOwner = item.createdBy === user?._id;
  const isAdmin = (item.admins || []).some((a: any) => (typeof a === 'string' ? a : a._id) === user?._id) || isOwner;
  const isMember = myChannels.some((c: Chat) => c._id === item._id);

  // Filter out joined channels from 'Discover' tab
  if (activeTab === 'public' && isMember) return null;

  // Animation values
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  const animatedTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        delay: index * 50,
      }),
      Animated.timing(animatedTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        delay: index * 50,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: animatedOpacity, transform: [{ translateY: animatedTranslateY }] }}>
      <TouchableOpacity 
        style={styles.item} 
        onPress={() => router.push(isMember ? `/channel/${item._id}` : null as any)}
        activeOpacity={isMember ? 0.7 : 1}
      >
        <Avatar
          uri={item.icon}
          name={item.channelUsername || item.groupName}
          size={50}
          style={{ marginRight: 16 }}
        />
        
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {item.channelUsername || item.groupName}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.channelDescription || 'No description'}
          </Text>
          <View style={styles.meta}>
            <Ionicons name="people-outline" size={14} color={colors.mutedForeground} />
            <Text style={styles.metaText}>
              {item.subscriberCount || item.participants?.length || 0} subscribers
            </Text>
          </View>
        </View>

        {activeTab === 'public' && !isMember && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.joinButton]}
            onPress={() => onJoin(item._id)}
          >
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>
        )}

        {activeTab === 'my' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.leaveButton]}
            onPress={() => onMenuPress(item)}
          >
            <Ionicons 
              name="ellipsis-vertical" 
              size={20} 
              color={colors.mutedForeground} 
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ChannelListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [myChannels, setMyChannels] = useState<Chat[]>([]);
  const [publicChannels, setPublicChannels] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [menuChannel, setMenuChannel] = useState<Chat | null>(null);

  const fetchMyChannels = useCallback(async () => {
    try {
      const res = await channelApi.getUserChannels();
      setMyChannels(res.channels || []);
    } catch (err) {
      console.error('Failed to fetch my channels', err);
    }
  }, []);

  const fetchPublicChannels = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const res = await channelApi.getPublicChannels(currentPage, 20, searchQuery);
      
      if (reset) {
        setPublicChannels(res.channels || []);
        setPage(2);
      } else {
        setPublicChannels(prev => [...prev, ...(res.channels || [])]);
        setPage(currentPage + 1);
      }
      setHasMore(res.page < res.pages);
    } catch (err) {
      console.error('Failed to fetch public channels', err);
    } finally {
      setLoading(false);
    }
  }, [page, loading, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'my') {
        fetchMyChannels();
      }
    }, [activeTab, fetchMyChannels])
  );

  useEffect(() => {
    if (activeTab === 'my') {
      fetchMyChannels();
    } else {
      fetchPublicChannels(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'public') {
      const timeout = setTimeout(() => {
        fetchPublicChannels(true);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'my') {
      await fetchMyChannels();
    } else {
      await fetchPublicChannels(true);
    }
    setRefreshing(false);
  };

  const handleJoinChannel = async (channelId: string) => {
    try {
      await channelApi.subscribe(channelId);
      Alert.alert('Success', 'You have joined the channel');
      // Remove from public list locally to update UI immediately
      setPublicChannels(prev => prev.filter(c => c._id !== channelId));
      fetchMyChannels(); // Update my channels list in background
    } catch (error) {
      Alert.alert('Error', 'Failed to join channel');
    }
  };

  const handleLeaveChannel = async (channelId: string) => {
    Alert.alert(
      'Leave Channel',
      'Are you sure you want to leave this channel?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              await channelApi.unsubscribe(channelId);
              setMyChannels(prev => prev.filter(c => c._id !== channelId));
              fetchPublicChannels(true); // Refresh public list to potentially show it again
            } catch (error) {
              Alert.alert('Error', 'Failed to leave channel');
            }
          }
        }
      ]
    );
  };

  const handleDeleteChannel = async (channelId: string) => {
    Alert.alert(
      'Delete Channel',
      'Are you sure you want to delete this channel? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await channelApi.delete(channelId);
              setMyChannels(prev => prev.filter(c => c._id !== channelId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete channel');
            }
          }
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    header: { 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerTitle: { 
      fontSize: 32, 
      fontWeight: '800', 
      color: colors.foreground, 
      letterSpacing: -0.5,
    },
    newButton: { 
      backgroundColor: colors.primary, 
      width: 40,
      height: 40,
      borderRadius: 20, 
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary, 
      shadowOffset: { width: 0, height: 4 }, 
      shadowOpacity: 0.3, 
      shadowRadius: 8, 
      elevation: 4,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 4,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: 'center',
      borderRadius: 10,
    },
    tabActive: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.mutedForeground,
    },
    tabTextActive: {
      color: colors.primaryForeground,
      fontWeight: '700',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: colors.foreground,
    },
    item: { 
      flexDirection: 'row', 
      padding: 16, 
      alignItems: 'center', 
      marginHorizontal: 16, 
      marginVertical: 6, 
      borderRadius: 16, 
      backgroundColor: colors.card, 
      borderWidth: 1, 
      borderColor: colors.border, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 4, 
      elevation: 2,
    },
    avatar: { 
      width: 50, 
      height: 50, 
      borderRadius: 25, 
      backgroundColor: colors.primary, 
      justifyContent: 'center', 
      alignItems: 'center',
      marginRight: 16,
    },
    avatarText: { 
      color: colors.primaryForeground, 
      fontSize: 20, 
      fontWeight: '700',
    },
    info: { 
      flex: 1,
      justifyContent: 'center',
    },
    title: { 
      fontSize: 16, 
      fontWeight: '700', 
      color: colors.foreground, 
      marginBottom: 4,
    },
    subtitle: { 
      fontSize: 13, 
      color: colors.mutedForeground, 
      fontWeight: '500',
    },
    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
    },
    metaText: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginLeft: 4,
      marginRight: 12,
    },
    actionButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    joinButton: {
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    joinButtonText: {
      color: colors.primaryForeground,
      fontWeight: '700',
      fontSize: 13,
    },
    leaveButton: {
      backgroundColor: colors.primary + '15',
      width: 36,
      height: 36,
      borderRadius: 18,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    center: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      paddingHorizontal: 32,
      marginTop: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      lineHeight: 20,
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

  const renderItem = ({ item, index }: { item: Chat; index: number }) => {
    return (
      <ChannelItem 
        item={item} 
        index={index} 
        activeTab={activeTab}
        myChannels={myChannels}
        user={user}
        colors={colors}
        router={router}
        styles={styles}
        onJoin={handleJoinChannel}
        onMenuPress={setMenuChannel}
      />
    );
  };

  const displayData = activeTab === 'my' ? myChannels : publicChannels;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Channels</Text>
          <TouchableOpacity style={styles.newButton} onPress={() => setIsCreateOpen(true)}>
            <Ionicons name="add" size={24} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my' && styles.tabActive]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab('my');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
              My Channels
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'public' && styles.tabActive]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab('public');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'public' && styles.tabTextActive]}>
              Discover
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'public' && (
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.mutedForeground} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search channels..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
      </View>

      <FlatList 
        data={displayData}
        keyExtractor={(item) => item._id} 
        renderItem={renderItem} 
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={() => {
          if (activeTab === 'public' && hasMore) {
            fetchPublicChannels();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading && activeTab === 'public' ? <ActivityIndicator style={{ margin: 20 }} /> : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>
                {searchQuery ? '🔍' : (activeTab === 'my' ? '📢' : '📡')}
              </Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? 'No channels found' 
                  : (activeTab === 'my' ? 'No channels yet' : 'No new channels')}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? `No results matching "${searchQuery}"`
                  : (activeTab === 'my' 
                    ? 'Join a channel or create your own to get started' 
                    : 'You have joined all available channels or none match your search')}
              </Text>
            </View>
          ) : null
        } 
      />

      <ChannelCreateModal 
        visible={isCreateOpen} 
        onClose={() => { 
          setIsCreateOpen(false); 
          fetchMyChannels();
        }} 
      />

      <Modal
        visible={!!menuChannel}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuChannel(null)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuChannel(null)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuContent}>
                {menuChannel && (() => {
                   const isOwner = menuChannel.createdBy === user?._id || (typeof menuChannel.createdBy === 'object' && (menuChannel.createdBy as any)._id === user?._id);
                   
                   return (
                     <>
                        {!isOwner && (
                          <TouchableOpacity 
                            style={styles.menuItem} 
                            onPress={() => {
                              setMenuChannel(null);
                              handleLeaveChannel(menuChannel._id);
                            }}
                          >
                            <Ionicons name="log-out-outline" size={24} color={colors.foreground} />
                            <Text style={styles.menuItemText}>Leave Channel</Text>
                          </TouchableOpacity>
                        )}

                        {isOwner && (
                          <TouchableOpacity 
                            style={styles.menuItem} 
                            onPress={() => {
                              setMenuChannel(null);
                              handleDeleteChannel(menuChannel._id);
                            }}
                          >
                            <Ionicons name="trash-outline" size={24} color="#ef4444" />
                            <Text style={[styles.menuItemText, styles.menuItemDestructive]}>Delete Channel</Text>
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

