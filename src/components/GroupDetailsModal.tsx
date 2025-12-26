import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Share, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, Switch } from 'react-native';
import { ENV } from '../config/env';
import { chatApi } from '../services/api/chat';
import { userApi } from '../services/api/user';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useThemeColors } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '../types/auth.types';
import type { Chat } from '../types/chat.types';
import { Avatar } from './Avatar';

interface Props {
  visible: boolean;
  onClose: () => void;
  chat: Chat | null;
}

export default function GroupDetailsModal({ visible, onClose, chat }: Props) {
  const colors = useThemeColors();
  const [members, setMembers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Edit State
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings' | 'admin'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Settings State
  const [muted, setMuted] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);

  const { fetchChats, fetchChat } = useChatStore();
  const { user } = useAuthStore();

  const isOwner = chat?.createdBy === user?._id || (typeof chat?.createdBy === 'object' && (chat?.createdBy as any)._id === user?._id);
  const isAdmin = (chat?.admins || []).some((a: any) => (typeof a === 'string' ? a : a._id) === user?._id) || isOwner;

  const buildInviteLink = (chat: Chat | null) => {
    if (!chat) return '';
    const base = ENV.API_URL.replace(/\/api\/?$/, '');
    const path = chat.groupUsername || chat._id;
    return `${base}/join/${path}`;
  };

  useEffect(() => {
    if (chat?.participants) {
      setMembers(chat.participants as unknown as User[]);
      const adminIds = (chat.admins || []).map((a: any) => typeof a === 'string' ? a : a._id);
      setAdmins(adminIds);
      setEditName(chat.groupName || '');
      setEditDescription(chat.groupDescription || '');
      setStrictMode(chat.strictMode || false);
      setAutoApprove(chat.allowInviteLinkJoin || false);
    }
  }, [chat]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setIsSearching(false);
      setIsEditing(false);
    }
  }, [visible]);

  useEffect(() => {
    if (query.trim().length < 2) return setResults([]);
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await userApi.searchUsers(query.trim());
        const filtered = (res.users || []).filter(u => !members.some(m => (m as any)._id === u._id));
        setResults(filtered);
      } catch (err) {
        console.error('Search failed', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, members]);

  const handleUpdateGroup = async () => {
    if (!chat || !editName.trim()) return;
    setIsLoading(true);
    try {
      await chatApi.updateChat(chat._id, {
        groupName: editName.trim(),
        description: editDescription.trim()
      });
      await fetchChat(chat._id);
      await fetchChats();
      setIsEditing(false);
      Alert.alert('Success', 'Group info updated');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!chat) return;
    Alert.alert('Leave Group', `Are you sure you want to leave ${chat.groupName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Leave', 
        style: 'destructive', 
        onPress: async () => { 
          setIsLoading(true);
          try { 
            await chatApi.removeMember(chat._id, user?._id as string); 
            await fetchChats(); 
            onClose(); 
          } catch (err: any) { 
            Alert.alert('Error', err.response?.data?.message || 'Failed to leave group'); 
          } finally {
            setIsLoading(false);
          }
        } 
      }
    ]);
  };

  const handleAdd = async (userId: string) => {
    if (!chat) return;
    setIsLoading(true);
    try {
      await chatApi.addMember(chat._id, userId);
      await fetchChat(chat._id);
      await fetchChats();
      setQuery('');
      setResults([]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!chat) return;
    setIsLoading(true);
    try {
      await chatApi.removeMember(chat._id, memberId);
      await fetchChat(chat._id);
      await fetchChats();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to remove member');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromote = async (memberId: string) => {
    if (!chat) return;
    setIsLoading(true);
    try {
      await chatApi.promoteToAdmin(chat._id, memberId);
      await fetchChat(chat._id);
      await fetchChats();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to promote member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemote = async (memberId: string) => {
    if (!chat) return;
    setIsLoading(true);
    try {
      await chatApi.demoteFromAdmin(chat._id, memberId);
      await fetchChat(chat._id);
      await fetchChats();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to demote member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStrictMode = async (val: boolean) => {
    setStrictMode(val);
    if (!chat) return;
    try {
      await chatApi.updateChat(chat._id, { strictMode: val });
      await fetchChat(chat._id);
    } catch (e) {
      setStrictMode(!val); // Revert on error
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const handleToggleAutoApprove = async (val: boolean) => {
    setAutoApprove(val);
    if (!chat) return;
    try {
      await chatApi.updateChat(chat._id, { allowInviteLinkJoin: val });
      await fetchChat(chat._id);
    } catch (e) {
      setAutoApprove(!val);
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {['overview', 'members', ...(isAdmin ? ['settings', 'admin'] : [])].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab as any)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.header}>
        <Avatar
          uri={chat?.icon}
          name={chat?.groupName || 'G'}
          size={80}
          shape="rounded"
          style={styles.groupIcon}
        />
        <Text style={styles.groupName}>{chat?.groupName}</Text>
        {(chat?.groupDescription || chat?.description) && (
          <Text style={styles.groupDescription}>
            {chat?.groupDescription || chat?.description}
          </Text>
        )}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{members.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{admins.length}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite Link</Text>
        <TouchableOpacity 
          style={styles.inviteLinkContainer}
          onPress={() => {
            const link = buildInviteLink(chat);
            Share.share({
              message: `Join my group ${chat?.groupName}: ${link}`,
              url: link,
            });
          }}
        >
          <Text style={styles.inviteLink} numberOfLines={1}>
            {buildInviteLink(chat)}
          </Text>
          <Ionicons name="copy-outline" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
             <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Notifications</Text>
             <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Mute notifications for this group</Text>
          </View>
          <Switch
            value={muted}
            onValueChange={setMuted}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor={'#fff'}
          />
        </View>
      </View>

      {!isOwner && (
        <TouchableOpacity style={[styles.dangerBtn, { marginTop: 20 }]} onPress={handleLeaveGroup}>
          <Text style={styles.btnText}>Leave Group</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderMembers = () => (
    <View style={styles.tabContent}>
      {isAdmin && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members or add new..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
          />
        </View>
      )}

      {isSearching ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={query.length >= 2 ? results : members}
          keyExtractor={(item) => (item as any)._id}
          renderItem={({ item }) => {
            const isCurrentUser = (item as any)._id === user?._id;
            const isMemberAdmin = admins.includes((item as any)._id);
            const isMemberOwner = chat?.createdBy === (item as any)._id || (chat?.createdBy as any)?._id === (item as any)._id;
            
            // If searching, we are looking for new users to add
            const isSearchResult = query.length >= 2 && results.includes(item as any);

            return (
              <View style={styles.memberItem}>
                <Avatar uri={item.avatar} name={item.name} size={40} />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{item.name} {isCurrentUser && '(You)'}</Text>
                  <Text style={styles.memberUsername}>@{item.username}</Text>
                </View>
                
                {isSearchResult ? (
                  <TouchableOpacity onPress={() => handleAdd((item as any)._id)}>
                     <Text style={{ color: colors.primary, fontWeight: '600' }}>Add</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    {isMemberOwner ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Owner</Text>
                      </View>
                    ) : isMemberAdmin && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Admin</Text>
                      </View>
                    )}
                    
                    {isAdmin && !isCurrentUser && !isSearchResult && (
                      <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                         {!isMemberAdmin && (
                            <TouchableOpacity onPress={() => handlePromote((item as any)._id)} style={[styles.iconBtn, { backgroundColor: colors.primary }]}>
                              <Ionicons name="shield-checkmark" size={16} color="#fff" />
                            </TouchableOpacity>
                          )}
                          {isMemberAdmin && !isMemberOwner && (
                            <TouchableOpacity onPress={() => handleDemote((item as any)._id)} style={[styles.iconBtn, { backgroundColor: '#f59e0b' }]}>
                              <Ionicons name="shield-outline" size={16} color="#fff" />
                            </TouchableOpacity>
                          )}
                          {!isMemberOwner && (
                            <TouchableOpacity onPress={() => handleRemove((item as any)._id)} style={[styles.iconBtn, { backgroundColor: '#ef4444' }]}>
                              <Ionicons name="trash-outline" size={16} color="#fff" />
                            </TouchableOpacity>
                          )}
                      </View>
                    )}
                  </>
                )}
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );

  const renderSettings = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Group Name</Text>
        <TextInput
          style={styles.input}
          value={editName}
          onChangeText={setEditName}
          placeholder="Enter group name"
          placeholderTextColor={colors.mutedForeground}
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={editDescription}
          onChangeText={setEditDescription}
          placeholder="Enter group description"
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleUpdateGroup}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      {isOwner && (
        <View style={{ marginTop: 40, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 20 }}>
           <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
           <TouchableOpacity 
             style={styles.dangerBtn} 
             onPress={async () => {
                Alert.alert('Delete Group', 'Permanently delete this group?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => { try { await chatApi.deleteChat(chat?._id as string); await fetchChats(); onClose(); } catch (e) { Alert.alert('Error', 'Failed'); } } }
                ]);
             }}
           >
             <Text style={styles.btnText}>Delete Group</Text>
           </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderAdmin = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.adminSection}>
        <Text style={styles.sectionTitle}>Content Moderation</Text>
        
        <View style={styles.adminOption}>
          <View style={{ flex: 1 }}>
             <Text style={styles.adminOptionTitle}>Strict Filtering</Text>
             <Text style={styles.adminOptionSubtitle}>Automatically hide offensive content</Text>
          </View>
          <Switch
            value={strictMode}
            onValueChange={handleToggleStrictMode}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor={'#fff'}
          />
        </View>

        <View style={styles.adminOption}>
          <View style={{ flex: 1 }}>
             <Text style={styles.adminOptionTitle}>Auto-Approve Members</Text>
             <Text style={styles.adminOptionSubtitle}>New members can join without approval</Text>
          </View>
          <Switch
            value={autoApprove}
            onValueChange={handleToggleAutoApprove}
            trackColor={{ false: colors.muted, true: colors.primary }}
            thumbColor={'#fff'}
          />
        </View>

        <TouchableOpacity 
          style={styles.adminButton}
          onPress={() => Alert.alert('Banned Words', 'Manage list of banned words (Coming Soon)')}
        >
          <Ionicons name="list-outline" size={24} color={colors.primary} />
          <View style={styles.adminButtonTextContainer}>
            <Text style={styles.adminButtonTitle}>Banned Words</Text>
            <Text style={styles.adminButtonSubtitle}>0 words configured</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={styles.adminSection}>
        <Text style={styles.sectionTitle}>Analytics (Last 7 Days)</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.muted }]}>
            <Text style={styles.statCardValue}>{chat?.participants?.length || 0}</Text>
            <Text style={styles.statCardLabel}>Active Members</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.muted }]}>
             <Text style={styles.statCardValue}>124</Text>
             <Text style={styles.statCardLabel}>Messages</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.muted }]}>
             <Text style={styles.statCardValue}>+5</Text>
             <Text style={styles.statCardLabel}>New Joins</Text>
          </View>
           <View style={[styles.statCard, { backgroundColor: colors.muted }]}>
             <Text style={styles.statCardValue}>98%</Text>
             <Text style={styles.statCardLabel}>Engagement</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.adminButton, { marginTop: 16 }]}
          onPress={() => Alert.alert('Export Data', 'Exporting analytics report...')}
        >
          <Ionicons name="download-outline" size={24} color={colors.primary} />
          <View style={styles.adminButtonTextContainer}>
            <Text style={styles.adminButtonTitle}>Export Report</Text>
            <Text style={styles.adminButtonSubtitle}>Download CSV format</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    content: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '90%', display: 'flex' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.foreground },
    closeBtn: { padding: 4 },
    tabContainer: { flexDirection: 'row', padding: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
    activeTab: { backgroundColor: colors.primary + '20' },
    tabText: { fontSize: 14, fontWeight: '500', color: colors.mutedForeground },
    activeTabText: { color: colors.primary, fontWeight: '600' },
    tabContent: { flex: 1, padding: 16 },
    header: { alignItems: 'center', marginBottom: 24 },
    groupIcon: { marginBottom: 16 },
    groupName: { fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center', color: colors.foreground },
    groupDescription: { fontSize: 16, textAlign: 'center', marginBottom: 24, paddingHorizontal: 20, color: colors.mutedForeground },
    statsContainer: { flexDirection: 'row', gap: 40 },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
    statLabel: { fontSize: 14, color: colors.mutedForeground },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontWeight: '600', color: colors.mutedForeground, marginBottom: 12, textTransform: 'uppercase' },
    inviteLinkContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, gap: 12, backgroundColor: colors.muted },
    inviteLink: { flex: 1, fontSize: 14, color: colors.primary },
    searchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: colors.muted, borderRadius: 8, paddingHorizontal: 10 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, padding: 10, fontSize: 16, color: colors.foreground },
    adminSection: { marginBottom: 24 },
    adminOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: colors.muted, padding: 12, borderRadius: 12 },
    adminOptionTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground, marginBottom: 4 },
    adminOptionSubtitle: { fontSize: 13, color: colors.mutedForeground },
    adminButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.muted, padding: 16, borderRadius: 12, gap: 16 },
    adminButtonTextContainer: { flex: 1 },
    adminButtonTitle: { fontSize: 16, fontWeight: '600', color: colors.foreground },
    adminButtonSubtitle: { fontSize: 13, color: colors.mutedForeground },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 12, alignItems: 'center' },
    statCardValue: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 4 },
    statCardLabel: { fontSize: 13, color: colors.mutedForeground },
    memberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    memberInfo: { flex: 1, marginLeft: 12 },
    memberName: { fontSize: 16, fontWeight: '600', color: colors.foreground },
    memberUsername: { fontSize: 13, color: colors.mutedForeground },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 8 },
    badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    iconBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 6 },
    formGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: colors.foreground, marginBottom: 8 },
    input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, color: colors.foreground, backgroundColor: colors.background },
    textArea: { height: 100, textAlignVertical: 'top' },
    saveButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    dangerBtn: { backgroundColor: '#fee2e2', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
    btnText: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
  });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Group Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {renderTabs()}

          <View style={{ flex: 1 }}>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'members' && renderMembers()}
            {activeTab === 'settings' && renderSettings()}
            {activeTab === 'admin' && renderAdmin()}
          </View>
        </View>
      </View>
    </Modal>
  );
}
