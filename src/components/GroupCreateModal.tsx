import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { userApi } from '../services/api/user';
import { useChatStore } from '../store/chatStore';
import type { User } from '../types/auth.types';
import { useAppTheme } from '../utils/theme';
import { Avatar } from './Avatar';
import { SmartImage } from './SmartImage';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated?: (chat: any) => void;
}

export default function GroupCreateModal({ visible, onClose, onCreated }: Props) {
  const { colors, spacing, radius, typography, shadows } = useAppTheme();
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

  const styles = StyleSheet.create({
    overlay: { 
      flex: 1, 
      backgroundColor: 'rgba(0,0,0,0.6)', 
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    content: { 
      width: '100%',
      maxWidth: 500,
      maxHeight: '90%',
      backgroundColor: colors.card, 
      borderRadius: radius.xl, 
      ...shadows.lg,
      overflow: 'hidden',
    },
    headerRow: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: spacing.lg, 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    header: { 
      ...typography.h3,
      color: colors.foreground
    },
    close: { 
      fontSize: 24, 
      color: colors.mutedForeground,
      fontWeight: '300'
    },
    form: { 
      padding: spacing.lg,
    },
    input: { 
      backgroundColor: colors.input, 
      padding: spacing.md, 
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md, 
      marginBottom: spacing.lg,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.foreground,
    },
    sectionTitle: {
      fontSize: 13, 
      color: colors.mutedForeground, 
      marginBottom: spacing.sm, 
      fontWeight: '600' 
    },
    pickerContainer: {
      borderWidth: 1, 
      borderColor: colors.border, 
      borderRadius: radius.md, 
      overflow: 'hidden', 
      backgroundColor: colors.input,
      marginBottom: spacing.lg,
    },
    picker: {
      height: 50,
      color: colors.foreground,
    },
    iconRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
      gap: spacing.lg
    },
    iconPicker: { 
      width: 80, 
      height: 80, 
      borderRadius: radius.lg, 
      backgroundColor: colors.muted, 
      justifyContent: 'center', 
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed'
    },
    iconPickerText: { 
      color: colors.mutedForeground,
      fontSize: 13,
      fontWeight: '600'
    },
    iconPreview: { 
      width: 80, 
      height: 80, 
      borderRadius: radius.lg 
    },
    toggleButton: { 
      backgroundColor: colors.primary, 
      paddingHorizontal: spacing.xl, 
      paddingVertical: spacing.md, 
      borderRadius: radius.md,
      minWidth: 100,
      alignItems: 'center'
    },
    userItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      padding: spacing.md, 
      borderBottomWidth: 1, 
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    userName: { 
      ...typography.bodySemibold,
      color: colors.foreground
    },
    userSub: { 
      ...typography.caption,
      color: colors.mutedForeground, 
      marginTop: 2,
    },
    selectedRow: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
      gap: spacing.sm
    },
    selectedChip: { 
      backgroundColor: colors.primary, 
      paddingHorizontal: spacing.md, 
      paddingVertical: spacing.xs, 
      borderRadius: radius.full,
      ...shadows.sm
    },
    resultsContainer: {
      minHeight: 180, 
      marginTop: spacing.sm, 
      borderRadius: radius.lg, 
      overflow: 'hidden',
      backgroundColor: colors.input, // or muted
      borderWidth: 1,
      borderColor: colors.border,
    },
    createBtn: { 
      backgroundColor: colors.primary, 
      padding: spacing.lg, 
      borderRadius: radius.lg, 
      alignItems: 'center', 
      marginTop: spacing.xl,
      marginBottom: spacing.lg,
      ...shadows.md
    },
    createText: { 
      color: colors.primaryForeground, 
      fontWeight: '700',
      fontSize: 16
    },
    loadingContainer: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyContainer: {
      padding: spacing.xl,
      alignItems: 'center',
    }
  });

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => toggleSelect(item)}>
      <Avatar
        uri={item.avatar}
        name={item.name}
        size={40}
        style={{ marginRight: spacing.md }}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>{item.name}</Text>
        {item.username && <Text style={styles.userSub}>@{item.username}</Text>}
      </View>
      <Text style={{ color: selected.some(s => s._id === item._id) ? colors.primary : colors.mutedForeground }}>
        {selected.some(s => s._id === item._id) ? 'Selected' : 'Add'}
      </Text>
    </TouchableOpacity>
  );

  const renderUserWrapper = (item: User) => (
    <View key={item._id}>
      {renderUser({ item })}
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Create Group</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Group name *" 
              placeholderTextColor={colors.mutedForeground}
              value={groupName} 
              onChangeText={setGroupName} 
            />

            <TextInput 
              style={styles.input} 
              placeholder="Description (optional)" 
              placeholderTextColor={colors.mutedForeground}
              value={groupDescription} 
              onChangeText={setGroupDescription} 
              maxLength={500} 
            />

            <TextInput 
              style={styles.input} 
              placeholder="Group username (@groupname)" 
              placeholderTextColor={colors.mutedForeground}
              value={groupUsername} 
              onChangeText={(text) => setGroupUsername(text.toLowerCase())} 
              maxLength={30} 
            />

            <View style={{ marginBottom: spacing.lg }}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={groupCategory}
                  onValueChange={(value) => setGroupCategory(value)}
                  style={styles.picker}
                  dropdownIconColor={colors.foreground}
                >
                  <Picker.Item label="Other" value="other" style={{color: colors.foreground, backgroundColor: colors.card}} />
                  <Picker.Item label="Study" value="study" style={{color: colors.foreground, backgroundColor: colors.card}} />
                  <Picker.Item label="Gaming" value="gaming" style={{color: colors.foreground, backgroundColor: colors.card}} />
                  <Picker.Item label="Work" value="work" style={{color: colors.foreground, backgroundColor: colors.card}} />
                  <Picker.Item label="Hobbies" value="hobbies" style={{color: colors.foreground, backgroundColor: colors.card}} />
                  <Picker.Item label="Sports" value="sports" style={{color: colors.foreground, backgroundColor: colors.card}} />
                  <Picker.Item label="Entertainment" value="entertainment" style={{color: colors.foreground, backgroundColor: colors.card}} />
                </Picker>
              </View>
            </View>

            <TextInput 
              style={[styles.input, { minHeight: 100, textAlignVertical: 'top', paddingTop: spacing.md }]} 
              placeholder="Group rules (optional)" 
              placeholderTextColor={colors.mutedForeground}
              value={groupRules} 
              onChangeText={setGroupRules} 
              maxLength={1000}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.sectionTitle}>Appearance & Privacy</Text>
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
                  <Text style={{ color: colors.primaryForeground, fontWeight: '600', fontSize: 15 }}>{isPublic ? '🌐 Public' : '🔒 Private'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: spacing.sm }]}>Add Members *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Search users (type 2+ characters)" 
              placeholderTextColor={colors.mutedForeground}
              value={query} 
              onChangeText={setQuery} 
            />

            {selected.length > 0 && (
              <>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginBottom: spacing.sm }}>Selected ({selected.length})</Text>
                <View style={styles.selectedRow}>
                  {selected.map(u => (
                    <View key={u._id} style={styles.selectedChip}>
                      <Text style={{ color: colors.primaryForeground, fontSize: 13, fontWeight: '600' }}>{u.name}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={styles.resultsContainer}>
              {isSearching ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={{ marginTop: spacing.md, color: colors.mutedForeground }}>Searching...</Text>
                </View>
              ) : results.length > 0 ? (
                <>
                  <View style={{ padding: spacing.sm, backgroundColor: colors.muted }}>
                     <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Results ({results.length})</Text>
                  </View>
                  {results.map(renderUserWrapper)}
                </>
              ) : query.trim().length >= 2 ? (
                <View style={styles.emptyContainer}>
                  <Text style={{ color: colors.mutedForeground, fontSize: 14 }}>No users found</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={isCreating}>
              {isCreating ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.createText}>Create Group</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
