import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Modal, Platform, Animated, LayoutAnimation, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import "../../global.css";
import CommunityCreateModal from '../../src/components/CommunityCreateModal';
import CommunityMenuModal from '../../src/components/CommunityMenuModal';
import { useAuthStore } from '../../src/store/authStore';
import { useCommunityStore } from '../../src/store/communityStore';
import type { CommunityType } from '../../src/types/community.type';
import { useThemeColors, useAppTheme } from '../../src/utils/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Avatar } from '../../src/components/Avatar';

const Community = () => {
  const insets = useSafeAreaInsets();
  const { communities, publicCommunities, fetchUserCommunities, fetchPublicCommunities, isCommunitiesLoading, leaveCommunity, deleteCommunity, joinCommunity } = useCommunityStore();
  const { isCreateOpen, setIsCreateOpen } = useCommunityStore();
  const { user } = useAuthStore();
  const { colors, spacing, typography, radius, shadows } = useAppTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Enable LayoutAnimation on Android for smoother transitions
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
  }, []);

  const styles = StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: spacing.xl, 
      paddingVertical: spacing.lg, 
      borderBottomWidth: 0.5, 
      borderBottomColor: colors.border, 
      backgroundColor: colors.card, 
      ...shadows.sm
    },
    headerTitle: { 
      ...typography.h2,
      color: colors.foreground, 
      letterSpacing: -0.5 
    },
    newButton: { 
      backgroundColor: colors.primary, 
      paddingHorizontal: spacing.lg, 
      paddingVertical: spacing.sm + 2, 
      borderRadius: radius.md, 
      ...shadows.md
    },
    newButtonText: { 
      ...typography.bodySemibold,
      color: colors.primaryForeground, 
      fontSize: 14 
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
      marginHorizontal: spacing.xs,
    },
    tabActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabText: {
      ...typography.bodySemibold,
      fontSize: 14,
      color: colors.mutedForeground,
    },
    tabTextActive: {
      color: colors.primaryForeground,
      fontWeight: '700',
    },
    item: { 
      flexDirection: 'row', 
      paddingHorizontal: spacing.lg, 
      paddingVertical: spacing.lg - 2, 
      alignItems: 'center', 
      marginHorizontal: spacing.lg, 
      marginVertical: spacing.xs, 
      borderRadius: radius.lg, 
      backgroundColor: colors.card, 
      borderWidth: 0.8, 
      borderColor: colors.border, 
      ...shadows.sm
    },
    leftArea: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatar: { 
      width: 56, 
      height: 56, 
      borderRadius: 28, 
      backgroundColor: colors.primary, 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginRight: spacing.lg - 2 
    },
    avatarText: { 
      color: colors.primaryForeground, 
      fontSize: 20, 
      fontWeight: '700' 
    },
    info: { 
      flex: 1,
      gap: spacing.xs,
    },
    title: { 
      ...typography.bodySemibold,
      fontSize: 16, 
      color: colors.foreground, 
      letterSpacing: -0.2 
    },
    subtitle: { 
      ...typography.caption,
      fontSize: 12, 
      color: colors.mutedForeground, 
      fontWeight: '500' 
    },
    badge: {
      ...typography.caption,
      fontSize: 10,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 2,
    },
    center: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl,
    },
    emptyText: {
      ...typography.body,
      color: colors.mutedForeground,
      textAlign: 'center',
      fontWeight: '500',
    },
    menuBtn: { 
      padding: spacing.sm,
      marginLeft: spacing.sm,
    },
    actionBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
      marginLeft: spacing.sm,
      ...shadows.sm
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
  }, [fetchUserCommunities, fetchPublicCommunities]);

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

  // join handled via menu

  const onCommunityMenu = (community: CommunityType) => {
    console.debug('[Community] onCommunityMenu called for', community._id);
    // refresh store data first so modal uses latest membership/admin state
    (async () => {
      try {
        await fetchUserCommunities();
        await fetchPublicCommunities();
      } catch {
        // ignore
      }
      setMenuCommunity(community);
    })();
  };

  // in-component modal state and handlers
  const [menuCommunity, setMenuCommunity] = useState<CommunityType | null>(null);

  // helper to find the latest community object from stores (user communities or public list)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getFreshCommunity = (id: string) => {
    const fromMy = (communities || []).find((c: CommunityType) => String(c._id) === String(id));
    if (fromMy) return fromMy;
    const fromPublic = (publicCommunities?.communities || []).find((c: CommunityType) => String(c._id) === String(id));
    return fromPublic || null;
  };

  const handleLeave = async (community: CommunityType) => {
    try {
      await leaveCommunity(community._id);
      Alert.alert('Success', 'Left community successfully');
      setMenuCommunity(null);
      fetchUserCommunities();
      fetchPublicCommunities();
    } catch {
      Alert.alert('Error', 'Failed to leave community');
    }
  };

  const handleJoin = async (community: CommunityType) => {
    try {
      await joinCommunity(community._id);
      Alert.alert('Success', 'Joined community successfully');
      setMenuCommunity(null);
      fetchUserCommunities();
      fetchPublicCommunities();
    } catch {
      Alert.alert('Error', 'Failed to join community');
    }
  };

  const handleDelete = async (community: CommunityType) => {
    if (Platform.OS === 'web') {
      const ok = window.confirm('Are you sure you want to delete this community? This action cannot be undone.');
      if (!ok) return;
      const success = await deleteCommunity(community._id);
      if (success) {
        Alert.alert('Success', 'Community deleted successfully');
      } else {
        Alert.alert('Error', 'Failed to delete community');
      }
      setMenuCommunity(null);
      fetchUserCommunities();
      fetchPublicCommunities();
      return;
    }

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
            setMenuCommunity(null);
            fetchUserCommunities();
            fetchPublicCommunities();
          },
        },
      ]
    );
  };

  const renderCommunityItem = ({ item, index }: { item: CommunityType; index: number }) => {
    const members = item.members || [];
    const admins = item.admins || [];
    const groups = item.groups || [];
    const channels = item.channels || [];
    
    const isMember = members.includes(user?._id || '');
    const isAdmin = admins.includes(user?._id || '');

    // Subtle appear animation per item
    const animatedOpacity = new Animated.Value(0);
    const animatedTranslateY = new Animated.Value(8);
    Animated.parallel([
      Animated.timing(animatedOpacity, { toValue: 1, duration: 280, useNativeDriver: true, delay: Math.min(index * 45, 400) }),
      Animated.timing(animatedTranslateY, { toValue: 0, duration: 280, useNativeDriver: true, delay: Math.min(index * 45, 400) }),
    ]).start();

    return (
      <Animated.View style={[styles.item, { opacity: animatedOpacity, transform: [{ translateY: animatedTranslateY }] }] }>
        {/* Left area is pressable to navigate into the community */}
        <TouchableOpacity style={styles.leftArea} onPress={() => handleCommunityPress(item)} activeOpacity={0.85}>
          <View style={{ marginRight: spacing.md }}>
            <Avatar
              uri={item.icon}
              name={item.name}
              size={56}
              shape="rounded"
            />
          </View>
          <View style={styles.info}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>
              {members.length} member{members.length !== 1 ? 's' : ''} • {groups.length + channels.length} chat{groups.length + channels.length !== 1 ? 's' : ''}
            </Text>
            {isAdmin && <Text style={styles.badge}>👑 Admin</Text>}
            {!isAdmin && isMember && <Text style={styles.badge}>✓ Member</Text>}
            {item.description ? (
              <Text style={[styles.subtitle, { marginTop: 4 }]} numberOfLines={1}>
                {item.description}
              </Text>
            ) : (
              item.isPublic && <Text style={styles.badge}>🌐 Public</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Right-side actions: Join button for non-members of public communities; otherwise menu */}
        {activeTab === 'public' ? (
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => handleJoin(item)}
            activeOpacity={0.9}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="log-in-outline" size={16} color={colors.primaryForeground} />
              <Text style={styles.actionBtnText}>Join</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.menuBtn} 
            onPress={() => {
              console.debug('[Community] menu button pressed for', item._id);
              onCommunityMenu(item);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="more-vert" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };

  const displayData = activeTab === 'my'
    ? communities
    : (publicCommunities?.communities || []).filter((c) => {
        const members = c.members || [];
        const uid = user?._id || '';
        return uid ? !members.some((m: any) => (typeof m === 'string' ? m : m?._id) === uid) : true;
      });

  if (isCommunitiesLoading && displayData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Communities</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: spacing.md, color: colors.mutedForeground }}>Loading communities...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Communities</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => setIsCreateOpen(true)}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="add" size={18} color={colors.primaryForeground} />
            <Text style={styles.newButtonText}>New</Text>
          </View>
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
            My Communities
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

      {/* In-component modal for community menu (works on web + native) */}
      {menuCommunity && (
        <Modal transparent animationType="fade" visible={true} onRequestClose={() => setMenuCommunity(null)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 320, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, marginBottom: spacing.md }}>{menuCommunity.name}</Text>
              {/* Determine role using fresh data from stores */}
              {(() => {
                const fresh = menuCommunity ? getFreshCommunity(String(menuCommunity._id)) : null;
                const target = fresh || menuCommunity;
                const targetMembers = target ? (target.members || []) : [];
                const targetAdmins = target ? (target.admins || []) : [];
                const uid = user?._id || '';
                const isMember = uid ? targetMembers.some((m: any) => (typeof m === 'string' ? m : m?._id) === uid) : false;
                const isAdmin = uid ? targetAdmins.some((a: any) => (typeof a === 'string' ? a : a?._id) === uid) : false;
                return (
                  <>
                    {isMember && !isAdmin && (
                      <TouchableOpacity style={styles.actionBtn} onPress={() => target && handleLeave(target)}>
                        <Text style={styles.actionBtnText}>Leave Group</Text>
                      </TouchableOpacity>
                    )}
                    {!isMember && target?.isPublic && (
                      <TouchableOpacity style={styles.actionBtn} onPress={() => target && handleJoin(target)}>
                        <Text style={styles.actionBtnText}>Join Group</Text>
                      </TouchableOpacity>
                    )}
                    {isAdmin && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.destructive }]} onPress={() => target && handleDelete(target)}>
                        <Text style={styles.actionBtnText}>Delete Group</Text>
                      </TouchableOpacity>
                    )}
                  </>
                );
              })()}

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.background, marginTop: spacing.sm }]} onPress={() => setMenuCommunity(null)}>
                <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <FlatList
        data={displayData}
        keyExtractor={(item) => String(item._id)}
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
            <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>
              {activeTab === 'my' ? '🏘️' : '🌍'}
            </Text>
            <Text style={styles.emptyText}>
              {activeTab === 'my' 
                ? 'No communities yet' 
                : 'No public communities found'}
            </Text>
            <Text style={[styles.emptyText, { fontSize: 14, marginTop: spacing.sm }]}>
              {activeTab === 'my'
                ? 'Create one to get started!'
                : 'Check back later for new communities.'}
            </Text>
          </View>
        }
      />

      <CommunityCreateModal visible={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </View>
  );
};

export default Community;