import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Picker, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { userApi } from '../services/api/user';
import { useChatStore } from '../store/chatStore';
import type { User } from '../types/auth.types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function GroupCreateModal({ visible, onClose }: Props) {
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
      if (!res.cancelled) {
        // Keep uri for preview; prefer base64 when available
        if ((res as any).base64) {
          setIconUri(`data:image/jpeg;base64,${(res as any).base64}`);
        } else {
          setIconUri((res as any).uri || (res as any).uri);
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
        groupDescription: groupDescription.trim() || undefined,
        groupUsername: groupUsername.trim() || undefined,
        groupRules: groupRules.trim() || undefined,
        groupCategory: groupCategory || 'other',
        icon: iconUri || undefined, 
        isPublic 
      });
      if (chat) {
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
      <View style={styles.userAvatar}><Text style={styles.userAvatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{item.name}</Text>
        {item.username && <Text style={styles.userSub}>@{item.username}</Text>}
      </View>
      <Text style={{ color: selected.some(s => s._id === item._id) ? '#007AFF' : '#999' }}>{selected.some(s => s._id === item._id) ? 'Selected' : 'Add'}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Create Group</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            <TextInput style={styles.input} placeholder="Group name" value={groupName} onChangeText={setGroupName} />

            <TextInput style={styles.input} placeholder="Description" value={groupDescription} onChangeText={setGroupDescription} maxLength={500} />

            <TextInput style={styles.input} placeholder="Group username (@groupname)" value={groupUsername} onChangeText={(text) => setGroupUsername(text.toLowerCase())} maxLength={30} />

            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Category</Text>
              <View style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden' }}>
                <Picker
                  selectedValue={groupCategory}
                  onValueChange={(value) => setGroupCategory(value)}
                  style={{ height: 40 }}
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
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} 
              placeholder="Group rules" 
              value={groupRules} 
              onChangeText={setGroupRules} 
              maxLength={1000}
              multiline
              numberOfLines={4}
            />

            <View style={styles.iconRow}>
              <TouchableOpacity style={styles.iconPicker} onPress={pickImage}>
                {iconUri ? <Image source={{ uri: iconUri }} style={styles.iconPreview} /> : <Text style={styles.iconPickerText}>Pick Icon</Text>}
              </TouchableOpacity>
              <View style={{ marginLeft: 12 }}>
                <TouchableOpacity onPress={() => setIsPublic(!isPublic)} style={styles.toggleButton}>
                  <Text style={{ color: '#fff' }}>{isPublic ? 'Public' : 'Private'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <TextInput style={styles.input} placeholder="Search users to add (type 2+ chars)" value={query} onChangeText={setQuery} />
            </View>

            <View style={styles.selectedRow}>
              {selected.map(u => (
                <View key={u._id} style={styles.selectedChip}><Text style={{ color: '#fff' }}>{u.name}</Text></View>
              ))}
            </View>

            <View style={{ height: 200 }}>
              {isSearching ? <ActivityIndicator /> : <FlatList data={results} keyExtractor={(i) => i._id} renderItem={renderUser} />}
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '85%' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  header: { fontSize: 18, fontWeight: '700' },
  close: { fontSize: 20, color: '#666' },
  form: { padding: 16 },
  input: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 8 },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  iconPicker: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  iconPickerText: { color: '#666' },
  iconPreview: { width: 64, height: 64, borderRadius: 8 },
  toggleButton: { backgroundColor: '#007AFF', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f7f7f7' },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  userAvatarText: { color: '#fff', fontWeight: '700' },
  userName: { fontWeight: '600' },
  userSub: { color: '#666', marginTop: 2 },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 },
  selectedChip: { backgroundColor: '#007AFF', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 16, marginRight: 8, marginBottom: 8 },
  createBtn: { backgroundColor: '#007AFF', padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  createText: { color: '#fff', fontWeight: '700' },
});
