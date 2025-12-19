import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import "../../global.css";
import CommunityCreateModal from '../../src/components/CommunityCreateModal';
import { useAuthStore } from '../../src/store/authStore';
import { useCommunityStore } from '../../src/store/communityStore';
import type { CommunityType } from '../../src/types/community.type';
import { useThemeColors } from '../../src/utils/theme';

const Community = () => {
  const { communities, publicCommunities, fetchUserCommunities, fetchPublicCommunities, isCommunitiesLoading, joinCommunity, leaveCommunity, deleteCommunity } = useCommunityStore();
  const { isCreateOpen, setIsCreateOpen } = useCommunityStore();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [refreshing, setRefreshing] = useState(false);

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: colors.background 
    },
    header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      borderBottomWidth: 0.5, 
      borderBottomColor: colors.border, 
      backgroundColor: colors.card, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.06, 
      shadowRadius: 8, 
      elevation: 3 
    },
    headerTitle: { 
      fontSize: 32, 
      fontWeight: '800', 
      color: colors.foreground, 
      letterSpacing: -0.5 
    },
    newButton: { 
      backgroundColor: colors.primary, 
      paddingHorizontal: 16, 
      paddingVertical: 10, 
      borderRadius: 10, 
      shadowColor: colors.primary, 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.25, 
      shadowRadius: 5, 
      elevation: 3 
    },
    newButtonText: { 
      color: colors.primaryForeground, 
      fontWeight: '700', 
      fontSize: 14 
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      paddingHorizontal: 18,
      paddingVertical: 12,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginHorizontal: 6,
    },
    tabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
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
    item: { 
      flexDirection: 'row', 
      paddingHorizontal: 16, 
      paddingVertical: 14, 
      alignItems: 'center', 
      marginHorizontal: 16, 
      marginVertical: 6, 
      borderRadius: 12, 
      backgroundColor: colors.card, 
      borderWidth: 0.8, 
      borderColor: colors.border, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 1 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 3, 
      elevation: 2 
    },
    avatar: { 
      width: 56, 
      height: 56, 
      borderRadius: 28, 
      backgroundColor: colors.primary, 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginRight: 14 
    },
    avatarImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    avatarText: { 
      color: colors.primaryForeground, 
      fontSize: 20, 
      fontWeight: '700' 
    },
    info: { 
      flex: 1,
      gap: 4,
    },
    title: { 
      fontSize: 16, 
      fontWeight: '700', 
      color: colors.foreground, 
      letterSpacing: -0.2 
    },
    subtitle: { 
      fontSize: 12, 
      color: colors.mutedForeground, 
      fontWeight: '500' 
    },
    badge: {
      fontSize: 10,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 2,
    },
    center: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    emptyText: {
      color: colors.mutedForeground,
      fontSize: 16,
      textAlign: 'center',
      fontWeight: '500',
      lineHeight: 24,
    },
    menuBtn: { 
      padding: 8,
      marginLeft: 8,
    },
    actionBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
      marginLeft: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    actionBtnText: {
      color: colors.primaryForeground,
      fontSize: 12,
      fontWeight: '600',
    },
  });

  useEffect(() => {
    fetchUserCommunities();
    fetchPublicCommunities();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'my') {
        await fetchUserCommunities();
      } else {
        await fetchPublicCommunities(1);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleCommunityPress = (community: CommunityType) => {
    router.push(`/community/${community._id}` as any);
  };

  const handleJoinCommunity = async (communityId: string) => {
    try {
      await joinCommunity(communityId);
      Alert.alert('Success', 'Joined community successfully!');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to join community');
    }
  };

  const onCommunityMenu = (community: CommunityType) => {
    const isAdmin = (community.admins || []).includes(user?._id || '');
    const isMember = (community.members || []).includes(user?._id || '');

    const actions = [];

    if (isMember && !isAdmin) {
      actions.push({
        text: 'Leave Community',
        onPress: async () => {
          try {
            await leaveCommunity(community._id);
            Alert.alert('Success', 'Left community successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to leave community');
          }
        },
      });
    }

    if (isAdmin) {
      actions.push({
        text: 'Delete Community',
        style: 'destructive' as const,
        onPress: async () => {
          Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this community? This action cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  const success = await deleteCommunity(community._id);
                  if (success) {
                    Alert.alert('Success', 'Community deleted successfully');
                  } else {
                    Alert.alert('Error', 'Failed to delete community');
                  }
                },
              },
            ]
          );
        },
      });
    }

    actions.push({ text: 'Cancel', style: 'cancel' as const });

    Alert.alert(community.name, undefined, actions);
  };

  const renderCommunityItem = ({ item }: { item: CommunityType }) => {
    const members = item.members || [];
    const admins = item.admins || [];
    const groups = item.groups || [];
    const channels = item.channels || [];
    
    const isMember = members.includes(user?._id || '');
    const isAdmin = admins.includes(user?._id || '');

    return (
      <TouchableOpacity style={styles.item} onPress={() => handleCommunityPress(item)}>
        <View style={styles.avatar}>
          {item.icon ? (
            <Image source={{ uri: item.icon }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subtitle}>
            {members.length} member{members.length !== 1 ? 's' : ''} • {groups.length + channels.length} chat{groups.length + channels.length !== 1 ? 's' : ''}
          </Text>
          {isAdmin && <Text style={styles.badge}>👑 Admin</Text>}
          {!isAdmin && isMember && <Text style={styles.badge}>✓ Member</Text>}
          {item.isPublic && <Text style={styles.badge}>🌐 Public</Text>}
        </View>
        {activeTab === 'public' && !isMember && (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={(e) => {
              e.stopPropagation();
              handleJoinCommunity(item._id);
            }}
          >
            <Text style={styles.actionBtnText}>Join</Text>
          </TouchableOpacity>
        )}
        {isMember && (
          <TouchableOpacity 
            style={styles.menuBtn} 
            onPress={(e) => {
              e.stopPropagation();
              onCommunityMenu(item);
            }}
          >
            <Text style={{ fontSize: 18, color: colors.mutedForeground }}>⋮</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const displayData = activeTab === 'my' ? communities : (publicCommunities?.communities || []);

  if (isCommunitiesLoading && displayData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Communities</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.mutedForeground }}>Loading communities...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communities</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => setIsCreateOpen(true)}>
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            My Communities
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'public' && styles.tabActive]}
          onPress={() => setActiveTab('public')}
        >
          <Text style={[styles.tabText, activeTab === 'public' && styles.tabTextActive]}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayData}
        keyExtractor={(item) => item._id}
        renderItem={renderCommunityItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              {activeTab === 'my' 
                ? 'No communities yet.\nCreate one to get started!' 
                : 'No public communities available'}
            </Text>
          </View>
        }
      />

      <CommunityCreateModal visible={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </View>
  );
};

export default Community;