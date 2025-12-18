import { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, TextInput, Alert, Share } from 'react-native';
import { ENV } from '../config/env';
import type { Chat } from '../types/chat.types';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../services/api/user';
import { chatApi } from '../services/api/chat';
import type { User } from '../types/auth.types';

interface Props {
  visible: boolean;
  onClose: () => void;
  chat: Chat | null;
}

export default function GroupDetailsModal({ visible, onClose, chat }: Props) {
  const [members, setMembers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { fetchChats, fetchChat } = useChatStore();
  const { user } = useAuthStore();
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
    }
  }, [chat]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setIsSearching(false);
    }
  }, [visible]);

  useEffect(() => {
    if (query.trim().length < 2) return setResults([]);
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await userApi.searchUsers(query.trim());
        // exclude existing members
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

  const handleAdd = async (userId: string) => {
    if (!chat) return;
    setIsLoading(true);
    try {
      await chatApi.addMember(chat._id, userId);
      await fetchChat(chat._id);
      await fetchChats();
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Group Info</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
          </View>

          <View style={{ padding: 12 }}>
            <Text style={{ fontWeight: '700', fontSize: 16 }}>{chat?.groupName || 'Group'}</Text>
            <Text style={{ color: '#666', marginTop: 6 }}>{chat?._id}</Text>

            <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#007AFF' }]} onPress={async () => {
                const link = buildInviteLink(chat);
                try {
                  await Share.share({ message: link });
                } catch (e) {
                  Alert.alert('Share Failed', 'Unable to share invite link');
                }
              }}>
                <Text style={{ color: '#fff' }}>Share Invite</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e53935' }]} onPress={async () => {
                if (!chat) return;
                Alert.alert('Delete Group', 'Are you sure you want to delete this group?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => { try { await chatApi.deleteChat(chat._id); await fetchChats(); onClose(); } catch (err) { Alert.alert('Error', 'Failed to delete group'); } } }
                ]);
              }}>
                <Text style={{ color: '#fff' }}>Delete</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={{ marginBottom: 6, fontWeight: '600' }}>Members</Text>
              {isLoading ? <ActivityIndicator /> : (
                <FlatList data={members} keyExtractor={(i) => (i as any)._id} renderItem={({ item }) => {
                  const isCurrentUser = (item as any)._id === user?._id;
                  return (
                    <View style={styles.memberRow}>
                      <View>
                        <Text style={{ fontWeight: '600' }}>{(item as any).name}</Text>
                        {(item as any).username && <Text style={{ color: '#666' }}>@{(item as any).username}</Text>}
                        {isCurrentUser && <Text style={{ color: '#999', fontSize: 12 }}>You</Text>}
                      </View>
                      {!isCurrentUser && (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {!admins.includes((item as any)._id) && (
                            <TouchableOpacity onPress={() => handlePromote((item as any)._id)} style={styles.actionBtn}><Text style={{ color: '#fff' }}>Promote</Text></TouchableOpacity>
                          )}
                          {admins.includes((item as any)._id) && (
                            <TouchableOpacity onPress={() => handleDemote((item as any)._id)} style={[styles.actionBtn, { backgroundColor: '#FF9800' }]}><Text style={{ color: '#fff' }}>Demote</Text></TouchableOpacity>
                          )}
                          <TouchableOpacity onPress={() => handleRemove((item as any)._id)} style={[styles.actionBtn, { backgroundColor: '#e53935' }]}><Text style={{ color: '#fff' }}>Remove</Text></TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                }} />
              )}
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={{ marginBottom: 6, fontWeight: '600' }}>Add Members</Text>
              <TextInput style={styles.input} placeholder="Search users (2+ chars)" value={query} onChangeText={setQuery} />
              {isSearching ? <ActivityIndicator /> : (
                <FlatList data={results} keyExtractor={(i) => i._id} renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultRow} onPress={() => handleAdd(item._id)}>
                    <Text style={{ fontWeight: '600' }}>{item.name}</Text>
                    <Text style={{ color: '#007AFF' }}>Add</Text>
                  </TouchableOpacity>
                )} />
              )}
            </View>

          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  header: { fontSize: 18, fontWeight: '700' },
  close: { fontSize: 20, color: '#666' },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f7f7f7' },
  actionBtn: { backgroundColor: '#007AFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 8 },
  input: { backgroundColor: '#f5f5f5', padding: 10, borderRadius: 8, marginBottom: 8 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f7f7f7' },
});
