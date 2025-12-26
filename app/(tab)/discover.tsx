import React, { useState, useEffect, useCallback, useMemo, use } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../src/utils/theme';
import { channelApi } from '../../src/services/api/channel';
import { communityApi } from '../../src/services/api/community';
import { useChatStore } from '../../src/store/chatStore';
import { Avatar } from '../../src/components/Avatar';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const { fetchChats } = useChatStore();
  

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'channels' | 'communities'>('all');
  const [sortOption, setSortOption] = useState<'popular' | 'recent'>('popular');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [channels, setChannels] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);

  const fetchDiscoverContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [channelsRes, communitiesRes] = await Promise.all([
        channelApi.getPublicChannels(1, 50),
        communityApi.getPublicCommunities(1, 50)
      ]);
      setChannels(channelsRes.channels || []);
      setCommunities(communitiesRes.communities || []);
    } catch (err) {
      console.error('Failed to load discover content', err);
      setError('Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscoverContent();
  }, [fetchDiscoverContent]);

  const filteredItems = useMemo(() => {
    let items: any[] = [];
    if (filterType === 'all' || filterType === 'channels') {
      items = [...items, ...channels.map(c => ({ kind: 'channel', item: c }))];
    }
    if (filterType === 'all' || filterType === 'communities') {
      items = [...items, ...communities.map(c => ({ kind: 'community', item: c }))];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(({ item }) => 
        (item.name || item.groupName || '').toLowerCase().includes(q) ||
        (item.description || item.channelDescription || '').toLowerCase().includes(q)
      );
    }

    return items.sort((a, b) => {
      if (sortOption === 'popular') {
        const countA = (a.item.subscriberCount || a.item.memberCount || 0);
        const countB = (b.item.subscriberCount || b.item.memberCount || 0);
        return countB - countA;
      } else { // recent
        const dateA = new Date(a.item.createdAt || 0).getTime();
        const dateB = new Date(b.item.createdAt || 0).getTime();
        return dateB - dateA;
      }
    });
  }, [channels, communities, filterType, sortOption, searchQuery]);

  const handleJoin = async (item: any, kind: string) => {
    // Implement join logic or navigation
    if (kind === 'channel') {
      router.push(`/channel/${item._id}`);
    } else {
      router.push(`/community/${item._id}`);
    }
  };

  const renderItem = ({ kind, item }: { kind: string, item: any }) => (
    <TouchableOpacity 
      key={`${kind}-${item._id}`} 
      style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleJoin(item, kind)}
    >
      <View style={{ marginRight: 12 }}>
        <Avatar
          uri={item.icon}
          name={item.name || item.groupName || '?'}
          size={50}
          shape="rounded"
        />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
            {item.name || item.groupName}
          </Text>
          <View style={[styles.badge, { backgroundColor: kind === 'channel' ? colors.primary : colors.muted }]}>
            <Text style={styles.badgeText}>{kind === 'channel' ? 'Channel' : 'Community'}</Text>
          </View>
        </View>
        <Text style={[styles.itemDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.description || item.channelDescription || 'No description'}
        </Text>
        <Text style={[styles.itemStats, { color: colors.mutedForeground }]}>
          {item.subscriberCount || item.memberCount || 0} {kind === 'channel' ? 'subscribers' : 'members'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.foreground,
      marginBottom: 12,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.foreground,
    },
    filterContainer: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.muted,
      marginRight: 8,
    },
    activeFilterChip: {
      backgroundColor: colors.primary,
    },
    filterChipText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
    },
    activeFilterChipText: {
      color: '#fff',
    },
    listContent: {
      padding: 16,
    },
    itemCard: {
      flexDirection: 'row',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
    },
    itemContent: {
      flex: 1,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      flex: 1,
      marginRight: 8,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#fff',
    },
    itemDescription: {
      fontSize: 14,
      marginBottom: 4,
    },
    itemStats: {
      fontSize: 12,
    },
    loader: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: 'red',
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.mutedForeground} style={styles.searchIcon} />
          {/* @ts-ignore */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search channels & communities..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer} contentContainerStyle={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'all' && styles.activeFilterChip]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterChipText, filterType === 'all' && styles.activeFilterChipText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'channels' && styles.activeFilterChip]}
            onPress={() => setFilterType('channels')}
          >
            <Text style={[styles.filterChipText, filterType === 'channels' && styles.activeFilterChipText]}>Channels</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'communities' && styles.activeFilterChip]}
            onPress={() => setFilterType('communities')}
          >
            <Text style={[styles.filterChipText, filterType === 'communities' && styles.activeFilterChipText]}>Communities</Text>
          </TouchableOpacity>
          
          <View style={{ width: 1, backgroundColor: colors.border, marginHorizontal: 8, height: 20, alignSelf: 'center' }} />

          <TouchableOpacity
            style={[styles.filterChip, sortOption === 'popular' && styles.activeFilterChip]}
            onPress={() => setSortOption('popular')}
          >
            <Text style={[styles.filterChipText, sortOption === 'popular' && styles.activeFilterChipText]}>Popular</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, sortOption === 'recent' && styles.activeFilterChip]}
            onPress={() => setSortOption('recent')}
          >
            <Text style={[styles.filterChipText, sortOption === 'recent' && styles.activeFilterChipText]}>New</Text>
          </TouchableOpacity>
        </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.loader}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchDiscoverContent}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {filteredItems.length === 0 ? (
              <View style={[styles.loader, { marginTop: 40 }]}>
                <Text style={{ fontSize: 40, marginBottom: 16 }}>🔍</Text>
                <Text style={{ fontSize: 16, color: colors.mutedForeground }}>No results found</Text>
              </View>
            ) : (
              filteredItems.map(renderItem)
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
