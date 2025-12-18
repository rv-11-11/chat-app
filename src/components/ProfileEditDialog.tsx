import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../services/api/user';
import { useThemeColors } from '../utils/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';

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
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setPreviewUrl(base64);
      }
    } catch (error) {
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
      } = {
        name: formData.name,
        email: formData.email,
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
              {previewUrl ? (
                <Image source={{ uri: previewUrl }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.avatarText}>
                    {getInitials(formData.name || 'U')}
                  </Text>
                </View>
              )}
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
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
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



