import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../services/api/user';
import { useThemeColors } from '../utils/theme';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Avatar } from './Avatar';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

interface ProfileEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileEditDialog({ isOpen, onClose }: ProfileEditDialogProps) {
  const { user, setUser } = useAuthStore();
  const colors = useThemeColors();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    isOnlineVisible: true,
    readReceipts: true,
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setPreviewUrl(user.avatar || '');
      setUsernameError('');
    }
  }, [user, isOpen]);

  const handleAvatarChange = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size (limit to 5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Error', 'Image too large. Maximum size is 5MB.');
          return;
        }

        let base64 = asset.base64;
        
        // Fallback if base64 is missing
        if (!base64 && asset.uri) {
          try {
            base64 = await FileSystem.readAsStringAsync(asset.uri, { 
              encoding: 'base64' 
            });
          } catch (readError) {
            console.error('Failed to read image:', readError);
            Alert.alert('Error', 'Failed to process image');
            return;
          }
        }

        if (base64) {
          // Ensure data URI prefix
          const dataUri = base64.startsWith('data:') 
            ? base64 
            : `data:image/jpeg;base64,${base64}`;
          setPreviewUrl(dataUri);
        }
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateUsername = (username: string) => {
    if (!username) return '';
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 30) return 'Username cannot exceed 30 characters';
    if (!/^[a-z0-9_]+$/.test(username)) {
      return 'Only lowercase letters, numbers, and underscores allowed';
    }
    return '';
  };

  const handleUsernameChange = (value: string) => {
    const lowercaseValue = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData({ ...formData, username: lowercaseValue });
    setUsernameError(validateUsername(lowercaseValue));
  };

  const handleSubmit = async () => {
    const usernameValidation = validateUsername(formData.username);
    if (usernameValidation) {
      setUsernameError(usernameValidation);
      return;
    }

    setIsLoading(true);

    try {
      const payload: {
        name: string;
        username?: string;
        email: string;
        phone?: string;
        avatar?: string;
        isOnlineVisible?: boolean;
        readReceipts?: boolean;
      } = {
        name: formData.name,
        email: formData.email,
        isOnlineVisible: formData.isOnlineVisible,
        readReceipts: formData.readReceipts,
      };

      if (formData.username.trim()) {
        payload.username = formData.username.trim();
      }

      if (formData.phone.trim()) {
        payload.phone = formData.phone.trim();
      }

      if (previewUrl && previewUrl !== user?.avatar) {
        payload.avatar = previewUrl;
      }

      const response = await userApi.updateProfile(payload);
      if (response.user) {
        setUser(response.user);
        Alert.alert('Success', 'Profile updated successfully');
        onClose();
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ?? 'Failed to update profile';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Edit Profile
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.muted }]}
            >
              <FontAwesome name="times" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <Avatar
                uri={previewUrl}
                name={formData.name || 'U'}
                size={100}
                onPress={handleAvatarChange}
                style={{ marginBottom: 12 }}
              />
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={handleAvatarChange}
              >
                <FontAwesome name="upload" size={16} color={colors.primaryForeground} />
                <Text style={[styles.uploadButtonText, { color: colors.primaryForeground }]}>
                  Change Photo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name Field */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Enter your name"
                placeholderTextColor={colors.mutedForeground}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            {/* Username Field */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Username</Text>
              <View style={styles.usernameContainer}>
                <View
                  style={[
                    styles.usernamePrefix,
                    {
                      backgroundColor: colors.muted,
                      borderColor: usernameError ? '#dc2626' : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.usernamePrefixText, { color: colors.mutedForeground }]}>
                    @
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    styles.usernameInput,
                    {
                      backgroundColor: colors.muted,
                      color: colors.foreground,
                      borderColor: usernameError ? '#dc2626' : colors.border,
                    },
                  ]}
                  placeholder="username"
                  placeholderTextColor={colors.mutedForeground}
                  value={formData.username}
                  onChangeText={handleUsernameChange}
                  maxLength={30}
                  autoCapitalize="none"
                />
              </View>
              {usernameError ? (
                <Text style={styles.errorText}>{usernameError}</Text>
              ) : (
                <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                  Only lowercase letters, numbers, and underscores
                </Text>
              )}
            </View>

            {/* Email Field */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.muted,
                    color: colors.mutedForeground,
                    borderColor: colors.border,
                  },
                ]}
                value={formData.email}
                editable={false}
              />
              <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                Email cannot be changed
              </Text>
            </View>

            {/* Phone Field */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Phone Number</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Enter your phone number"
                placeholderTextColor={colors.mutedForeground}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>
          </ScrollView>

          {/* Buttons */}
          <View style={[styles.buttons, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.foreground }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.saveButtonText, { color: colors.primaryForeground }]}>
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  privacyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  privacyHint: {
    fontSize: 13,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  usernameContainer: {
    flexDirection: 'row',
  },
  usernamePrefix: {
    borderWidth: 1,
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usernamePrefixText: {
    fontSize: 16,
    fontWeight: '500',
  },
  usernameInput: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {},
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});


