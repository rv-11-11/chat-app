import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { useChatStore } from '../store/chatStore';
import { userApi } from '../services/api/user';
import { useThemeColors } from '../utils/theme';
import type { User } from '../types/auth.types';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Avatar } from './Avatar';

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NewChatModal({ visible, onClose }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const { createChat } = useChatStore();
  const router = useRouter();
  const colors = useThemeColors();

  // Debounced search
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setSearchResults([]);
      return;
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await userApi.searchUsers(searchQuery.trim());
        setSearchResults(response.users || []);
      } catch (error: any) {
        console.error('Failed to search users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, visible]);

  const handleCreateChat = async (userId: string) => {
    setLoadingUserId(userId);
    try {
      const chat = await createChat({
        participantId: userId,
        isGroup: false,
      });
      if (chat) {
        onClose();
        setSearchQuery('');
        setSearchResults([]);
        router.push(`/chat/${chat._id}`);
      }
    } catch (error: any) {
      console.error('Failed to create chat:', error);
    } finally {
      setLoadingUserId(null);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[styles.userItem, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleCreateChat(item._id)}
      disabled={loadingUserId !== null}
      activeOpacity={0.7}
    >
      <Avatar
        uri={item.avatar}
        name={item.name}
        size={50}
        style={{ marginRight: 12 }}
      />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.foreground }]}>{item.name}</Text>
        {item.username && (
          <Text style={[styles.userUsername, { color: colors.mutedForeground }]}>@{item.username}</Text>
        )}
      </View>
      {loadingUserId === item._id && (
        <ActivityIndicator size="small" color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%',
      minHeight: '50%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.foreground,
      letterSpacing: -0.2,
    },
    closeButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      backgroundColor: colors.muted,
    },
    closeButtonText: {
      fontSize: 20,
      color: colors.foreground,
      fontWeight: '600',
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    searchInput: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
      borderWidth: 1,
      borderColor: colors.border,
      fontWeight: '500',
    },
    resultsContainer: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    hintText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: 'center',
      fontWeight: '500',
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      marginVertical: 4,
      borderWidth: 0.8,
    },
    userAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    userAvatarText: {
      fontSize: 18,
      fontWeight: '700',
    },
    userInfo: {
      flex: 1,
      gap: 2,
    },
    userName: {
      fontSize: 15,
      fontWeight: '600',
    },
    userUsername: {
      fontSize: 13,
      fontWeight: '500',
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalOverlay, { flex: 1 }]}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Chat</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="times" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or @username..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
          </View>

          <View style={styles.resultsContainer}>
            {searchQuery.trim().length < 2 ? (
              <View style={styles.center}>
                <Text style={styles.hintText}>
                  Type at least 2 characters to search
                </Text>
              </View>
            ) : isSearching ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : searchResults.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.hintText}>No users found</Text>
              </View>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item._id}
                renderItem={renderUserItem}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={true}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}




