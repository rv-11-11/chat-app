import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import "../../global.css";
import { useAuthStore } from '../../src/store/authStore';
import { useChatStore } from '../../src/store/chatStore';
import { useCommunityStore } from '../../src/store/communityStore';
import { useThemeColors } from '../../src/utils/theme';

export default function CommunityDetailScreen() {
  const insets = useSafeAreaInsets();
  const { communityId } = useLocalSearchParams<{ communityId: string }>();
  const { currentCommunity, getCommunity, leaveCommunity, deleteCommunity, addChatToCommunity, removeChatFromCommunity, isCommunitiesLoading } = useCommunityStore();
  const { chats, fetchChats } = useChatStore();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<'groups' | 'channels' | 'members'>('groups');

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
    communityDescription: {
      fontSize: 14,
      color: colors.foreground,
      marginTop: 12,
      lineHeight: 20,
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
    },
  });

  useEffect(() => {
    if (communityId) {
      loadCommunity();
      fetchChats();
    }
  }, [communityId]);

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
    const availableChats = chats.filter(chat => {
      if (chatType === 'GROUP') {
        return chat.isGroup && !currentCommunity?.groups.includes(chat._id);
      } else {
        return chat.type === 'CHANNEL' && !currentCommunity?.channels.includes(chat._id);
      }
    });

    if (availableChats.length === 0) {
      Alert.alert('No Chats', `No available ${activeSection} to add`);
      return;
    }

    const options = availableChats.map(chat => ({
      text: chat.groupName || chat.channelUsername || 'Unnamed',
      onPress: async () => {
        try {
          await addChatToCommunity(communityId, chat._id, chatType);
          Alert.alert('Success', `${chatType === 'GROUP' ? 'Group' : 'Channel'} added successfully`);
          await loadCommunity();
        } catch (error) {
          Alert.alert('Error', `Failed to add ${chatType.toLowerCase()}`);
        }
      },
    }));

    options.push({ text: 'Cancel', onPress: async () => {} });

    Alert.alert(`Add ${chatType === 'GROUP' ? 'Group' : 'Channel'}`, 'Select a chat to add:', options);
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

  const handleChatPress = (chatId: string) => {
    router.push(`/chat/${chatId}` as any);
  };

  if (!currentCommunity || isCommunitiesLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: colors.mutedForeground }}>Loading community...</Text>
      </View>
    );
  }

  const isMember = currentCommunity.members.includes(user?._id || '');
  const isAdmin = currentCommunity.admins.includes(user?._id || '');

  const communityGroups = chats.filter(chat => 
    chat.isGroup && currentCommunity.groups.includes(chat._id)
  );

  const communityChannels = chats.filter(chat => 
    chat.type === 'CHANNEL' && currentCommunity.channels.includes(chat._id)
  );

  const renderGroupItem = ({ item }: any) => (
    <TouchableOpacity style={styles.item} onPress={() => handleChatPress(item._id)}>
      <View style={styles.itemAvatar}>
        {item.icon ? (
          <Image source={{ uri: item.icon }} style={styles.itemAvatarImage} />
        ) : (
          <Text style={styles.itemAvatarText}>{(item.groupName || 'G').charAt(0).toUpperCase()}</Text>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.groupName || 'Unnamed Group'}</Text>
        <Text style={styles.itemSubtitle}>{item.participants?.length || 0} members</Text>
      </View>
      {isAdmin && (
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={() => handleRemoveChat(item._id, item.groupName || 'Group')}
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
          <Text style={styles.itemAvatarText}>{(item.channelName || 'C').charAt(0).toUpperCase()}</Text>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.channelName || 'Unnamed Channel'}</Text>
        <Text style={styles.itemSubtitle}>{item.subscribers?.length || 0} subscribers</Text>
      </View>
      {isAdmin && (
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={() => handleRemoveChat(item._id, item.channelName || 'Channel')}
        >
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderMemberItem = ({ item }: any) => (
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
          {currentCommunity.admins.includes(item._id) ? '👑 Admin' : 'Member'}
        </Text>
      </View>
    </View>
  );

  let displayData: any[] = [];
  let renderItemFunc = renderGroupItem;

  if (activeSection === 'groups') {
    displayData = communityGroups;
    renderItemFunc = renderGroupItem;
  } else if (activeSection === 'channels') {
    displayData = communityChannels;
    renderItemFunc = renderChannelItem;
  } else if (activeSection === 'members') {
    // For members, we'd need to fetch user details from IDs
    // For now, just show member count
    displayData = [];
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

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
              {currentCommunity.members.length} members • {currentCommunity.groups.length + currentCommunity.channels.length} chats
            </Text>
            {currentCommunity.isPublic && (
              <Text style={styles.communityStats}>🌐 Public Community</Text>
            )}
          </View>
        </View>

        {currentCommunity.description && (
          <Text style={styles.communityDescription}>{currentCommunity.description}</Text>
        )}

        <View style={styles.actionButtons}>
          {isAdmin && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={handleDelete}
            >
              <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
          {isMember && !isAdmin && (
            <TouchableOpacity style={styles.actionButton} onPress={handleLeave}>
              <Text style={styles.actionButtonText}>Leave</Text>
            </TouchableOpacity>
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
            Members ({currentCommunity.members.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection !== 'members' ? (
        <>
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
            <TouchableOpacity style={styles.addButton} onPress={handleAddChat}>
              <Text style={styles.addButtonText}>
                + Add {activeSection === 'groups' ? 'Group' : 'Channel'}
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            {currentCommunity.members.length} member{currentCommunity.members.length !== 1 ? 's' : ''} in this community
          </Text>
        </View>
      )}
    </View>
  );
}
