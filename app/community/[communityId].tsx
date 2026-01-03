import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Modal, TextInput, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import "../../global.css";
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore } from '../../src/store/chatStore';
import { useCommunityStore } from '../../src/store/communityStore';
import { useThemeColors } from '../../src/utils/theme';
import GroupCreateModal from '../../src/components/GroupCreateModal';
import ChannelCreateModal from '../../src/components/ChannelCreateModal';
import { channelApi } from '../../src/services/api/channel';
import { userApi } from '../../src/services/api/user';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import CommunitySettingsModal from '../../src/components/CommunitySettingsModal';

export default function CommunityDetailScreen() {
  const insets = useSafeAreaInsets();
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const { currentCommunity, getCommunity, leaveCommunity, deleteCommunity, addChatToCommunity, removeChatFromCommunity, isCommunitiesLoading, updateCommunity, promoteMember, demoteMember, removeMember } = useCommunityStore();
  const { chats, fetchChats } = useChatStore();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<'groups' | 'channels' | 'members'>('groups');
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberIdInput, setMemberIdInput] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsPublic, setSettingsPublic] = useState(true);
  const [settingsInviteJoin, setSettingsInviteJoin] = useState(true);
  const [addExistingOpen, setAddExistingOpen] = useState(false);
  const [addExistingType, setAddExistingType] = useState<'GROUP' | 'CHANNEL'>('GROUP');
  const [addExistingOptions, setAddExistingOptions] = useState<any[]>([]);
  const [userChannels, setUserChannels] = useState<any[]>([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const normalizeId = (value: any) => (typeof value === 'string' ? value : value?._id || '');
  const hasId = (list: any[] | undefined, id: string | undefined) => {
    if (!id || !list?.length) return false;
    return list.some((item) => normalizeId(item) === id);
  };
  const getChatName = (chat: any) => chat.groupName || chat.channelUsername || chat.groupUsername || 'Unnamed';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    header: {
      backgroundColor: colors.card,
      paddingHorizontal: 18,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    backButton: {
      padding: 8,
      marginBottom: 12,
    },
    backText: {
      fontSize: 24,
      color: colors.primary,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    headerActionBtn: {
      padding: 8,
      borderRadius: 10,
      minWidth: 40,
      minHeight: 40,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    communityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    communityIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    communityIconImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    communityIconText: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.primaryForeground,
    },
    communityInfo: {
      flex: 1,
    },
    communityName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 4,
    },
    communityStats: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 4,
    },
    actionIconRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginTop: 20,
      gap: 24,
    },
    actionIconBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    actionIconLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.foreground,
      marginTop: 4,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    actionButtonDanger: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.foreground,
    },
    actionButtonTextPrimary: {
      color: colors.primaryForeground,
    },
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      paddingHorizontal: 18,
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.mutedForeground,
    },
    tabTextActive: {
      color: colors.primaryForeground,
    },
    content: {
      flex: 1,
    },
    item: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignItems: 'center',
      marginHorizontal: 12,
      marginVertical: 6,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    itemAvatarImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
    },
    itemAvatarText: {
      color: colors.primaryForeground,
      fontSize: 18,
      fontWeight: '700',
    },
    itemInfo: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
    },
    itemSubtitle: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    removeButton: {
      padding: 8,
    },
    removeButtonText: {
      color: colors.accent,
      fontSize: 20,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      color: colors.mutedForeground,
      fontSize: 15,
      textAlign: 'center',
    },
    addButton: {
      backgroundColor: colors.primary,
      margin: 16,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    addButtonText: {
      color: colors.primaryForeground,
      fontSize: 15,
      fontWeight: '700',
      padding: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      borderRadius: 16,
      backgroundColor: colors.card,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 12,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.foreground,
      backgroundColor: colors.background,
      marginBottom: 10,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },
    modalAction: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    modalActionPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modalActionText: {
      color: colors.foreground,
      fontWeight: '600',
    },
    modalActionTextPrimary: {
      color: colors.primaryForeground,
    },
    menuCard: {
      position: 'absolute',
      top: 60,
      right: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 8,
      width: 220,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 4,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      gap: 8,
    },
    menuItemText: {
      color: colors.foreground,
      fontSize: 14,
      fontWeight: '600',
    },
  });

  useEffect(() => {
    if (communityId) {
      loadCommunity();
      fetchChats();
      fetchUserChannels();
    }
  }, [communityId]);

  // Reset member search state when modal closes
  useEffect(() => {
    if (!addMemberOpen) {
      setMemberQuery('');
      setMemberResults([]);
      setMemberSearching(false);
    }
  }, [addMemberOpen]);

  // Live user search for adding members (2+ chars, debounced)
  useEffect(() => {
    if (!addMemberOpen) return;
    if (memberQuery.trim().length < 2) {
      setMemberResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setMemberSearching(true);
      try {
        const res = await userApi.searchUsers(memberQuery.trim());
        const currentMemberIds = (currentCommunity?.members || []).map(normalizeId);
        const filtered = (res.users || []).filter(u => !currentMemberIds.includes(u._id));
        setMemberResults(filtered);
      } catch (err) {
        console.error('Search users failed', err);
        setMemberResults([]);
      } finally {
        setMemberSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [memberQuery, addMemberOpen, currentCommunity]);

  const fetchUserChannels = async () => {
    try {
      const res = await channelApi.getUserChannels();
      setUserChannels(res.channels || []);
    } catch (err) {
      console.error('Failed to fetch user channels', err);
      setUserChannels([]);
    }
  };

  const loadCommunity = async () => {
    try {
      await getCommunity(communityId);
    } catch (error) {
      Alert.alert('Error', 'Failed to load community');
      router.back();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCommunity();
      await fetchChats();
      await fetchUserChannels();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLeave = async () => {
    Alert.alert(
      'Leave Community',
      'Are you sure you want to leave this community?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveCommunity(communityId);
              Alert.alert('Success', 'Left community successfully');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to leave community');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Community',
      'Are you sure you want to delete this community? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCommunity(communityId);
            if (success) {
              Alert.alert('Success', 'Community deleted successfully');
              router.back();
            } else {
              Alert.alert('Error', 'Failed to delete community');
            }
          },
        },
      ]
    );
  };

  const handleAddChat = () => {
    const chatType = activeSection === 'groups' ? 'GROUP' : 'CHANNEL';
    const groupIds = (currentCommunity?.groups || []).map(normalizeId);
    const channelIds = (currentCommunity?.channels || []).map(normalizeId);
    const availableChats =
      chatType === 'GROUP'
        ? chats.filter(chat => chat.isGroup && !groupIds.includes(chat._id))
        : userChannels.filter(channel => channel._id && !channelIds.includes(channel._id));

    if (availableChats.length === 0) {
      Alert.alert('No Chats', `No available ${activeSection} to add`);
      return;
    }

    setAddExistingType(chatType);
    setAddExistingOptions(availableChats);
    setAddExistingOpen(true);
  };

  const handleGroupCreated = async (chat: any) => {
    try {
      if (!chat?._id) {
        console.error('Group created but no ID returned');
        Alert.alert('Error', 'Failed to create group');
        return;
      }
      // Add the newly created group to the community
      await addChatToCommunity(communityId as string, chat._id, 'GROUP');
      // Refresh community data and chats list
      await Promise.all([loadCommunity(), fetchChats()]);
      Alert.alert('Success', 'Group created and added to community');
    } catch (error) {
      console.error('Failed to add group to community', error);
      Alert.alert('Error', 'Group created but failed to add to community');
    } finally {
      setCreateGroupOpen(false);
    }
  };

  const handleChannelCreated = async (channel: any) => {
    try {
      if (!channel?._id) {
        console.error('Channel created but no ID returned');
        Alert.alert('Error', 'Failed to create channel');
        return;
      }
      // Add the newly created channel to the community
      await addChatToCommunity(communityId as string, channel._id, 'CHANNEL');
      // Refresh community data and chats list
      await Promise.all([loadCommunity(), fetchChats(), fetchUserChannels()]);
      Alert.alert('Success', 'Channel created and added to community');
    } catch (error) {
      console.error('Failed to add channel to community', error);
      Alert.alert('Error', 'Channel created but failed to add to community');
    } finally {
      setCreateChannelOpen(false);
    }
  };

  const handleAddMember = async () => {
    if (!memberIdInput.trim()) {
      Alert.alert('Missing user ID', 'Enter a user ID to add');
      return;
    }
    try {
      const updated = await useCommunityStore.getState().addMemberToCommunity(communityId as string, memberIdInput.trim());
      if (updated) {
        await loadCommunity();
        setAddMemberOpen(false);
        setMemberIdInput('');
        Alert.alert('Success', 'Member added to community');
      } else {
        Alert.alert('Error', 'Failed to add member');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add member');
    }
  };

  const handleAddMemberSelect = async (userId: string) => {
    try {
      const updated = await useCommunityStore.getState().addMemberToCommunity(communityId as string, userId);
      if (updated) {
        await loadCommunity();
        setAddMemberOpen(false);
        setMemberQuery('');
        setMemberResults([]);
        Alert.alert('Success', 'Member added to community');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveChat = async (chatId: string, chatName: string) => {
    Alert.alert(
      'Remove Chat',
      `Remove "${chatName}" from this community?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeChatFromCommunity(communityId, chatId);
              Alert.alert('Success', 'Chat removed successfully');
              await loadCommunity();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove chat');
            }
          },
        },
      ]
    );
  };

  const handleAddExistingSelect = async (chatId: string, chatName: string) => {
    try {
      await addChatToCommunity(communityId, chatId, addExistingType);
      console.log('Added existing chat to community:', chatId);
      // Refresh community data and chats list
      await Promise.all([loadCommunity(), fetchChats()]);
      Alert.alert('Success', `${addExistingType === 'GROUP' ? 'Group' : 'Channel'} "${chatName}" added successfully`);
      setAddExistingOpen(false);
    } catch (error) {
      console.error('Failed to add existing chat', error);
      Alert.alert('Error', `Failed to add ${addExistingType === 'GROUP' ? 'group' : 'channel'}`);
    }
  };

  const handleChatPress = (chatId: string) => {
    router.push(`/chat/${chatId}` as any);
  };

  const openSettings = () => {
    if (!currentCommunity) return;
    setSettingsOpen(true);
  };

  const handleSaveSettings = async (data: any) => {
    try {
      if (!currentCommunity) return;
      
      const updated = await updateCommunity(communityId as string, data);
      
      if (updated) {
        setSettingsOpen(false);
        Alert.alert('Success', 'Community settings updated');
      } else {
        Alert.alert('Error', 'Failed to update settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handlePromoteMember = async (memberId: string, memberName: string) => {
    Alert.alert(
      'Promote to Admin',
      `Are you sure you want to promote ${memberName} to admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Promote',
          onPress: async () => {
            const success = await promoteMember(communityId as string, memberId);
            if (success) {
              Alert.alert('Success', `${memberName} is now an admin`);
            } else {
              Alert.alert('Error', 'Failed to promote member');
            }
          }
        }
      ]
    );
  };

  const handleDemoteMember = async (memberId: string, memberName: string) => {
    Alert.alert(
      'Demote Admin',
      `Are you sure you want to demote ${memberName} from admin?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote',
          style: 'destructive',
          onPress: async () => {
            const success = await demoteMember(communityId as string, memberId);
            if (success) {
              Alert.alert('Success', `${memberName} is no longer an admin`);
            } else {
              Alert.alert('Error', 'Failed to demote member');
            }
          }
        }
      ]
    );
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this community?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeMember(communityId as string, memberId);
            if (success) {
              Alert.alert('Success', `${memberName} has been removed`);
            } else {
              Alert.alert('Error', 'Failed to remove member');
            }
          }
        }
      ]
    );
  };

  const shareInviteLink = async () => {
    try {
      if (!currentCommunity) {
        Alert.alert('Error', 'Community not loaded');
        return;
      }
      if (!currentCommunity!.isPublic) {
        Alert.alert('Private', 'Only public communities can be shared');
        return;
      }
      if (currentCommunity!.allowInviteLinkJoin === false) {
        Alert.alert('Disabled', 'Invite links are disabled for this community');
        return;
      }
      const username = currentCommunity!.username || (communityId as string);
      const link = `${process.env.EXPO_PUBLIC_WEB_URL || 'https://example.com'}/join/${username}`;
      await Share.share({ message: `Join ${currentCommunity!.name}: ${link}`, url: link });
    } catch (error) {
      Alert.alert('Error', 'Unable to share invite link');
    }
  };

  if (!currentCommunity || isCommunitiesLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.mutedForeground }}>Loading community...</Text>
      </View>
    );
  }

  const memberIds = (currentCommunity.members || []).map(normalizeId);
  const adminIds = (currentCommunity.admins || []).map(normalizeId);
  const groupIds = (currentCommunity.groups || []).map(normalizeId);
  const channelIds = (currentCommunity.channels || []).map(normalizeId);

  const isMember = hasId(memberIds, user?._id);
  const isAdmin = hasId(adminIds, user?._id);

  const communityGroups = (chats || [])
    .filter(Boolean)
    .filter((chat) => chat._id && chat.isGroup && groupIds.includes(chat._id));

  const communityChannels = (userChannels || [])
    .filter(Boolean)
    .filter((channel) => channel._id && channelIds.includes(channel._id));

  const renderGroupItem = ({ item }: any) => (
    <TouchableOpacity style={styles.item} onPress={() => handleChatPress(item._id)}>
      <View style={styles.itemAvatar}>
        {item.icon ? (
          <Image source={{ uri: item.icon }} style={styles.itemAvatarImage} />
        ) : (
          <Text style={styles.itemAvatarText}>
            {(item.groupName || item.groupUsername || 'G').charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.groupName || item.groupUsername || 'Unnamed Group'}</Text>
        <Text style={styles.itemSubtitle} numberOfLines={1}>
          {item.groupDescription ? item.groupDescription : `${item.participants?.length ?? 0} members`}
        </Text>
      </View>
      {isAdmin && (
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={() => handleRemoveChat(item._id, item.groupName || item.groupUsername || 'Group')}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderChannelItem = ({ item }: any) => (
    <TouchableOpacity style={styles.item} onPress={() => handleChatPress(item._id)}>
      <View style={styles.itemAvatar}>
        {item.icon ? (
          <Image source={{ uri: item.icon }} style={styles.itemAvatarImage} />
        ) : (
          <Text style={styles.itemAvatarText}>
            {(item.groupName || item.channelUsername || item.groupUsername || 'C').charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>
          {item.groupName || item.channelUsername || item.groupUsername || 'Unnamed Channel'}
        </Text>
        <Text style={styles.itemSubtitle} numberOfLines={1}>
          {item.description ? item.description : `${item.subscriberCount ?? item.participants?.length ?? 0} subscribers`}
        </Text>
      </View>
      {isAdmin && (
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={() => handleRemoveChat(item._id, item.groupName || item.channelUsername || 'Channel')}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderMemberItem = ({ item }: any) => {
    const isItemAdmin = hasId(adminIds, item._id);
    const isSelf = normalizeId(item) === user?._id;

    return (
      <View style={styles.item}>
        <View style={styles.itemAvatar}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.itemAvatarImage} />
          ) : (
            <Text style={styles.itemAvatarText}>
              {(item.displayName || item.username || 'U').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{item.displayName || item.username || 'User'}</Text>
          <Text style={styles.itemSubtitle}>
            {isItemAdmin ? '👑 Admin' : 'Member'}
          </Text>
        </View>
        
        {isAdmin && !isSelf && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isItemAdmin ? (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.accent + '20' }]} 
                onPress={() => handleDemoteMember(item._id, item.displayName || item.username)}
              >
                <Ionicons name="arrow-down-circle-outline" size={20} color={colors.accent} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.actionBtn, { backgroundColor: colors.primary + '20' }]} 
                onPress={() => handlePromoteMember(item._id, item.displayName || item.username)}
              >
                <Ionicons name="arrow-up-circle-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.accent + '20' }]} 
              onPress={() => handleRemoveMember(item._id, item.displayName || item.username)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  let displayData: any[] = [];
  let renderItemFunc = renderGroupItem;

  if (activeSection === 'groups') {
    displayData = communityGroups;
    renderItemFunc = renderGroupItem;
  } else if (activeSection === 'channels') {
    displayData = communityChannels;
    renderItemFunc = renderChannelItem;
  } else if (activeSection === 'members') {
    displayData = currentCommunity.members || [];
    renderItemFunc = renderMemberItem;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.header}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setCreateGroupOpen(true)}>
              <MaterialIcons name="group-add" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setCreateChannelOpen(true)}>
              <MaterialIcons name="add-comment" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setMenuOpen((v) => !v)}>
              <MaterialIcons name="more-vert" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        {menuOpen && (
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); }}>
              <Ionicons name="information-circle-outline" size={18} color={colors.foreground} />
              <Text style={styles.menuItemText}>Community info</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); setActiveSection('members'); }}>
              <Ionicons name="people-outline" size={18} color={colors.foreground} />
              <Text style={styles.menuItemText}>View members</Text>
            </TouchableOpacity>
            {isMember && !isAdmin && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); handleLeave(); }}>
                <Ionicons name="exit-outline" size={18} color={colors.accent} />
                <Text style={[styles.menuItemText, { color: colors.accent }]}>Exit community</Text>
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); openSettings(); }}>
                <Ionicons name="settings-outline" size={18} color={colors.foreground} />
                <Text style={styles.menuItemText}>Settings</Text>
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); handleDelete(); }}>
                <Ionicons name="trash-outline" size={18} color={colors.accent} />
                <Text style={[styles.menuItemText, { color: colors.accent }]}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); shareInviteLink(); }}>
              <Ionicons name="share-outline" size={18} color={colors.foreground} />
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.communityHeader}>
          <View style={styles.communityIcon}>
            {currentCommunity.icon ? (
              <Image source={{ uri: currentCommunity.icon }} style={styles.communityIconImage} />
            ) : (
              <Text style={styles.communityIconText}>
                {currentCommunity.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.communityInfo}>
            <Text style={styles.communityName}>{currentCommunity.name}</Text>
            <Text style={styles.communityStats}>
              {memberIds.length} members • {groupIds.length + channelIds.length} chats
            </Text>
            {currentCommunity.description ? (
              <Text style={[styles.communityStats, { marginTop: 6 }]} numberOfLines={3}>
                {currentCommunity.description}
              </Text>
            ) : (
              currentCommunity.isPublic && (
                <Text style={styles.communityStats}>🌐 Public Community</Text>
              )
            )}
          </View>
        </View>

        <View style={styles.actionIconRow}>
          {isAdmin && (
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete community"
            >
              <Ionicons name="trash-outline" size={18} color={colors.accent} />
              <Text style={[styles.actionIconLabel, { color: colors.accent }]}>Delete</Text>
            </TouchableOpacity>
          )}
          {isMember && !isAdmin && (
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={handleLeave}
              accessibilityRole="button"
              accessibilityLabel="Leave community"
            >
              <Ionicons name="exit-outline" size={18} color={colors.accent} />
              <Text style={[styles.actionIconLabel, { color: colors.accent }]}>Leave</Text>
            </TouchableOpacity>
          )}
          {isAdmin && (
            <>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={shareInviteLink}
                accessibilityRole="button"
                accessibilityLabel="Share invite link"
              >
                <Ionicons name="share-outline" size={18} color={colors.foreground} />
                <Text style={styles.actionIconLabel}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => setActiveSection('members')}
                accessibilityRole="button"
                accessibilityLabel="View members"
              >
                <Ionicons name="people-outline" size={18} color={colors.foreground} />
                <Text style={styles.actionIconLabel}>Members</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={openSettings}
                accessibilityRole="button"
                accessibilityLabel="Community settings"
              >
                <Ionicons name="settings-outline" size={18} color={colors.foreground} />
                <Text style={styles.actionIconLabel}>Settings</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'groups' && styles.tabActive]}
          onPress={() => setActiveSection('groups')}
        >
          <Text style={[styles.tabText, activeSection === 'groups' && styles.tabTextActive]}>
            Groups ({communityGroups.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'channels' && styles.tabActive]}
          onPress={() => setActiveSection('channels')}
        >
          <Text style={[styles.tabText, activeSection === 'channels' && styles.tabTextActive]}>
            Channels ({communityChannels.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeSection === 'members' && styles.tabActive]}
          onPress={() => setActiveSection('members')}
        >
          <Text style={[styles.tabText, activeSection === 'members' && styles.tabTextActive]}>
            Members ({memberIds.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayData}
        keyExtractor={(item) => item._id}
        renderItem={renderItemFunc}
        style={styles.content}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              No {activeSection} in this community yet
            </Text>
          </View>
        }
      />
      {isAdmin && (
        <View style={{ paddingBottom: insets.bottom + 10 }}>
          {activeSection === 'groups' && (
            <>
              <TouchableOpacity style={styles.addButton} onPress={() => setCreateGroupOpen(true)}>
                <Text style={styles.addButtonText}>+ New Group</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleAddChat}>
                <Text style={styles.addButtonText}>+ Add Group</Text>
              </TouchableOpacity>
            </>
          )}
          {activeSection === 'channels' && (
            <>
              <TouchableOpacity style={styles.addButton} onPress={() => setCreateChannelOpen(true)}>
                <Text style={styles.addButtonText}>+ New Channel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleAddChat}>
                <Text style={styles.addButtonText}>+ Add Channel</Text>
              </TouchableOpacity>
            </>
          )}
          {activeSection === 'members' && (
            <TouchableOpacity style={styles.addButton} onPress={() => setAddMemberOpen(true)}>
              <Text style={styles.addButtonText}>+ Add Members</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <GroupCreateModal
        visible={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onCreated={handleGroupCreated}
      />

      <ChannelCreateModal
        visible={createChannelOpen}
        onClose={() => setCreateChannelOpen(false)}
        onCreated={handleChannelCreated}
      />

      <Modal transparent visible={addExistingOpen} animationType="fade" onRequestClose={() => setAddExistingOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Add {addExistingType === 'GROUP' ? 'Group' : 'Channel'}
            </Text>
            <View style={{ maxHeight: 320 }}>
              <FlatList
                data={addExistingOptions}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.item, { marginHorizontal: 0, marginVertical: 4 }]}
                    onPress={() => handleAddExistingSelect(item._id, getChatName(item))}
                  >
                    <View style={styles.itemAvatar}>
                      {item.icon ? (
                        <Image source={{ uri: item.icon }} style={styles.itemAvatarImage} />
                      ) : (
                        <Text style={styles.itemAvatarText}>
                          {(getChatName(item).charAt(0) || 'U').toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{getChatName(item)}</Text>
                      <Text style={styles.itemSubtitle}>
                        {addExistingType === 'GROUP'
                          ? `${item.participants?.length ?? 0} members`
                          : `${item.subscriberCount ?? item.participants?.length ?? 0} subscribers`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Text style={styles.emptyText}>No available chats to add</Text>
                  </View>
                }
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalAction} onPress={() => setAddExistingOpen(false)}>
                <Text style={styles.modalActionText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={addMemberOpen} animationType="fade" onRequestClose={() => setAddMemberOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Members</Text>
            <TextInput
              style={styles.input}
              placeholder="Search users (2+ chars)"
              placeholderTextColor={colors.mutedForeground}
              value={memberQuery}
              onChangeText={setMemberQuery}
            />
            {memberSearching ? (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <FlatList
                data={memberResults}
                keyExtractor={(item) => item._id}
                style={{ maxHeight: 280 }}
                renderItem={({ item }) => (
                  <View style={[styles.item, { marginHorizontal: 0, marginVertical: 6 }]}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.name}</Text>
                      {item.username && (
                        <Text style={styles.itemSubtitle}>@{item.username}</Text>
                      )}
                    </View>
                    <TouchableOpacity style={[styles.modalAction, styles.modalActionPrimary, { paddingVertical: 8, minWidth: 80 }]} onPress={() => handleAddMemberSelect(item._id)}>
                      <Text style={[styles.modalActionText, styles.modalActionTextPrimary]}>Add</Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                    <Text style={styles.emptyText}>No users found</Text>
                  </View>
                }
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalAction} onPress={() => setAddMemberOpen(false)}>
                <Text style={styles.modalActionText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <CommunitySettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        community={currentCommunity}
        onSave={handleSaveSettings}
      />
    </View>
  );
}
