import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { userApi } from '../services/api/user';
import { useChatStore } from '../store/chatStore';
import type { User } from '../types/auth.types';
import { SmartImage } from './SmartImage';
import { Avatar } from './Avatar';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated?: (chat: any) => void;
}

export default function GroupCreateModal({ visible, onClose, onCreated }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupUsername, setGroupUsername] = useState('');
  const [groupRules, setGroupRules] = useState('');
  const [groupCategory, setGroupCategory] = useState('other');
  const [iconUri, setIconUri] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const createChat = useChatStore(state => state.createChat);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setSelected([]);
      setGroupName('');
      setGroupDescription('');
      setGroupUsername('');
      setGroupRules('');
      setGroupCategory('other');
      setIconUri(null);
      setIsPublic(false);
    }
  }, [visible]);

  useEffect(() => {
    if (query.trim().length < 2) return setResults([]);
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await userApi.searchUsers(query.trim());
        // Exclude already selected
        const filtered = (res.users || []).filter(u => !selected.some(s => s._id === u._id));
        setResults(filtered);
      } catch (err) {
        console.error('Search users failed', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, selected]);

  const toggleSelect = (user: User) => {
    if (selected.some(s => s._id === user._id)) {
      setSelected(selected.filter(s => s._id !== user._id));
    } else {
      setSelected([...selected, user]);
    }
  };

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, allowsEditing: true });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        
        // Check file size (limit to 5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Error', 'Image too large. Maximum size is 5MB.');
          return;
        }

        // Keep uri for preview; prefer base64 when available
        if (asset.base64) {
          setIconUri(`data:image/jpeg;base64,${asset.base64}`);
        } else {
          setIconUri(asset.uri || asset.uri);
        }
      }
    } catch (err) {
      console.error('Image pick error', err);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return Alert.alert('Validation', 'Group name is required');
    if (!selected || selected.length === 0) return Alert.alert('Validation', 'Please add at least one member');
    setIsCreating(true);
    try {
      const participantIds = selected.map(s => s._id);
      const chat = await createChat({ 
        participants: participantIds, 
        isGroup: true, 
        groupName: groupName.trim(),
        description: groupDescription.trim() || undefined,
        groupUsername: groupUsername.trim() || undefined,
        groupRules: groupRules.trim() || undefined,
        groupCategory: groupCategory || 'other',
        icon: iconUri || undefined, 
        isPublic 
      });
      if (chat) {
        if (onCreated) {
          onCreated(chat);
        }
        onClose();
      } else {
        Alert.alert('Error', 'Failed to create group');
      }
    } catch (err) {
      console.error('Create group failed', err);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => toggleSelect(item)}>
      <Avatar
        uri={item.avatar}
        name={item.name}
        size={40}
        style={{ marginRight: 14 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{item.name}</Text>
        {item.username && <Text style={styles.userSub}>@{item.username}</Text>}
      </View>
      <Text style={{ color: selected.some(s => s._id === item._id) ? '#007AFF' : '#999' }}>{selected.some(s => s._id === item._id) ? 'Selected' : 'Add'}</Text>
    </TouchableOpacity>
  );

  const renderUserWrapper = (item: User) => (
    <View key={item._id}>
      {renderUser({ item })}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Create Group</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 13, color: '#666', marginBottom: 8, fontWeight: '600' }}>Basic Information</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Group name *" 
              placeholderTextColor="#999"
              value={groupName} 
              onChangeText={setGroupName} 
            />

            <TextInput 
              style={styles.input} 
              placeholder="Description (optional)" 
              placeholderTextColor="#999"
              value={groupDescription} 
              onChangeText={setGroupDescription} 
              maxLength={500} 
            />

            <TextInput 
              style={styles.input} 
              placeholder="Group username (@groupname)" 
              placeholderTextColor="#999"
              value={groupUsername} 
              onChangeText={(text) => setGroupUsername(text.toLowerCase())} 
              maxLength={30} 
            />

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: '#666', marginBottom: 8, fontWeight: '600' }}>Category</Text>
              <View style={{ borderWidth: 1, borderColor: '#e8e8e8', borderRadius: 10, overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
                <Picker
                  selectedValue={groupCategory}
                  onValueChange={(value) => setGroupCategory(value)}
                  style={{ height: 50 }}
                >
                  <Picker.Item label="Other" value="other" />
                  <Picker.Item label="Study" value="study" />
                  <Picker.Item label="Gaming" value="gaming" />
                  <Picker.Item label="Work" value="work" />
                  <Picker.Item label="Hobbies" value="hobbies" />
                  <Picker.Item label="Sports" value="sports" />
                  <Picker.Item label="Entertainment" value="entertainment" />
                </Picker>
              </View>
            </View>

            <TextInput 
              style={[styles.input, { minHeight: 100, textAlignVertical: 'top', paddingTop: 14 }]} 
              placeholder="Group rules (optional)" 
              placeholderTextColor="#999"
              value={groupRules} 
              onChangeText={setGroupRules} 
              maxLength={1000}
              multiline
              numberOfLines={4}
            />

            <Text style={{ fontSize: 13, color: '#666', marginBottom: 10, fontWeight: '600' }}>Appearance & Privacy</Text>
            <View style={styles.iconRow}>
              <TouchableOpacity style={styles.iconPicker} onPress={pickImage}>
                {iconUri ? (
                  <SmartImage 
                    source={iconUri} 
                    style={styles.iconPreview} 
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.iconPickerText}>+ Icon</Text>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <TouchableOpacity onPress={() => setIsPublic(!isPublic)} style={styles.toggleButton}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{isPublic ? '🌐 Public' : '🔒 Private'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={{ fontSize: 13, color: '#666', marginBottom: 10, marginTop: 8, fontWeight: '600' }}>Add Members *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Search users (type 2+ characters)" 
              placeholderTextColor="#999"
              value={query} 
              onChangeText={setQuery} 
            />

            {selected.length > 0 && (
              <>
                <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Selected ({selected.length})</Text>
                <View style={styles.selectedRow}>
                  {selected.map(u => (
                    <View key={u._id} style={styles.selectedChip}>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{u.name}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={{ minHeight: 180, marginTop: 8, borderRadius: 12, overflow: 'hidden' }}>
              {isSearching ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={{ marginTop: 12, color: '#666' }}>Searching...</Text>
                </View>
              ) : results.length > 0 ? (
                <>
                  <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>Results ({results.length})</Text>
                  {results.map(renderUserWrapper)}
                </>
              ) : query.trim().length >= 2 ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Text style={{ color: '#999', fontSize: 14 }}>No users found</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={isCreating}>
              {isCreating ? <ActivityIndicator color="#fff" /> : <Text style={styles.createText}>Create Group</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'flex-end' 
  },
  content: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    maxHeight: '92%',
    paddingBottom: 20
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    padding: 20, 
    paddingBottom: 16,
    borderBottomWidth: 1, 
    borderBottomColor: '#e8e8e8' 
  },
  header: { 
    fontSize: 20, 
    fontWeight: '700',
    color: '#1a1a1a'
  },
  close: { 
    fontSize: 24, 
    color: '#666',
    fontWeight: '300'
  },
  form: { 
    padding: 20,
    paddingTop: 16
  },
  input: { 
    backgroundColor: '#f8f9fa', 
    padding: 14, 
    paddingHorizontal: 16,
    borderRadius: 10, 
    marginBottom: 16,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e8e8e8'
  },
  iconRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 4,
    marginBottom: 16,
    gap: 16
  },
  iconPicker: { 
    width: 80, 
    height: 80, 
    borderRadius: 12, 
    backgroundColor: '#f0f0f0', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed'
  },
  iconPickerText: { 
    color: '#666',
    fontSize: 13,
    fontWeight: '600'
  },
  iconPreview: { 
    width: 80, 
    height: 80, 
    borderRadius: 12 
  },
  toggleButton: { 
    backgroundColor: '#007AFF', 
    paddingHorizontal: 20, 
    paddingVertical: 12, 
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center'
  },
  userItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    paddingVertical: 12,
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
    marginBottom: 1
  },
  userAvatar: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#007AFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 14 
  },
  userAvatarText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 18
  },
  userName: { 
    fontWeight: '600',
    fontSize: 15,
    color: '#1a1a1a'
  },
  userSub: { 
    color: '#666', 
    marginTop: 3,
    fontSize: 13
  },
  selectedRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginTop: 4,
    marginBottom: 16,
    gap: 10
  },
  selectedChip: { 
    backgroundColor: '#007AFF', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  createBtn: { 
    backgroundColor: '#007AFF', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 24,
    marginBottom: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5
  },
  createText: { 
    color: '#fff', 
    fontWeight: '700',
    fontSize: 16
  },
});
