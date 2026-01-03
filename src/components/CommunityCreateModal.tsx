import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useCommunityStore } from '../store/communityStore';
import { useThemeColors, useAppTheme } from '../utils/theme';
import { SmartImage } from './SmartImage';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CommunityCreateModal({ visible, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUri, setIconUri] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  const { createCommunity, isCreatingCommunity } = useCommunityStore();
  const { colors, spacing, typography, radius, shadows } = useAppTheme();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modal: {
      width: '100%',
      maxWidth: 500,
      maxHeight: '85%',
      backgroundColor: colors.card,
      borderRadius: radius.xl,
      padding: spacing.xl,
      ...shadows.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xl,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      ...typography.h3,
      color: colors.foreground,
    },
    closeBtn: {
      padding: spacing.xs,
    },
    closeText: {
      fontSize: 24,
      color: colors.mutedForeground,
      fontWeight: '300',
    },
    content: {
      gap: spacing.lg,
    },
    label: {
      ...typography.bodySemibold,
      color: colors.foreground,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: 16,
      color: colors.foreground,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    imageSection: {
      gap: spacing.md,
    },
    imagePicker: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
    },
    imagePreview: {
      width: 100,
      height: 100,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    imagePickerText: {
      color: colors.mutedForeground,
      fontSize: 14,
      textAlign: 'center',
    },
    visibilitySection: {
      gap: spacing.md,
    },
    visibilityOptions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    visibilityOption: {
      flex: 1,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
    },
    visibilityOptionActive: {
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}10`,
    },
    visibilityText: {
      ...typography.bodySemibold,
      color: colors.mutedForeground,
    },
    visibilityTextActive: {
      color: colors.primary,
    },
    visibilityDesc: {
      ...typography.caption,
      color: colors.mutedForeground,
      marginTop: 4,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.xl,
    },
    button: {
      flex: 1,
      paddingVertical: spacing.lg - 2,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelBtn: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelText: {
      color: colors.foreground,
      fontSize: 16,
      fontWeight: '600',
    },
    createBtn: {
      backgroundColor: colors.primary,
      ...shadows.md,
    },
    createBtnDisabled: {
      opacity: 0.5,
      shadowOpacity: 0,
    },
    createText: {
      color: colors.primaryForeground,
      fontSize: 16,
      fontWeight: '700',
    },
  });

  useEffect(() => {
    if (!visible) {
      setName('');
      setDescription('');
      setIconUri(null);
      setIsPublic(true);
    }
  }, [visible]);

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        
        // Check file size (limit to 5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Error', 'Image too large. Maximum size is 5MB.');
          return;
        }

        if (asset.base64) {
          setIconUri(`data:image/jpeg;base64,${asset.base64}`);
        } else if (asset.uri) {
          setIconUri(asset.uri);
        }
      }
    } catch (err) {
      console.error('Image pick error', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      return Alert.alert('Validation', 'Community name is required');
    }

    try {
      await createCommunity({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
        icon: iconUri || undefined,
      });
      Alert.alert('Success', 'Community created successfully!');
      onClose();
    } catch (error: any) {
      console.error('Failed to create community:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create community');
    }
  };

  const canCreate = name.trim().length > 0 && !isCreatingCommunity;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Community</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View>
              <Text style={styles.label}>Community Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter community name"
                placeholderTextColor={colors.mutedForeground}
                maxLength={50}
              />
            </View>

            <View>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your community..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                maxLength={500}
              />
            </View>

            <View style={styles.imageSection}>
              <Text style={styles.label}>Community Icon</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {iconUri ? (
                  <>
                    <SmartImage 
                      source={iconUri} 
                      style={styles.imagePreview} 
                      contentFit="cover"
                    />
                    <Text style={styles.imagePickerText}>Tap to change</Text>
                  </>
                ) : (
                  <Text style={styles.imagePickerText}>📷 Tap to add community icon</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.visibilitySection}>
              <Text style={styles.label}>Visibility</Text>
              <View style={styles.visibilityOptions}>
                <TouchableOpacity
                  style={[styles.visibilityOption, isPublic && styles.visibilityOptionActive]}
                  onPress={() => setIsPublic(true)}
                >
                  <Text style={[styles.visibilityText, isPublic && styles.visibilityTextActive]}>
                    🌐 Public
                  </Text>
                  <Text style={styles.visibilityDesc}>Anyone can join</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.visibilityOption, !isPublic && styles.visibilityOptionActive]}
                  onPress={() => setIsPublic(false)}
                >
                  <Text style={[styles.visibilityText, !isPublic && styles.visibilityTextActive]}>
                    🔒 Private
                  </Text>
                  <Text style={styles.visibilityDesc}>Invite only</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.createBtn, !canCreate && styles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={!canCreate}
            >
              {isCreatingCommunity ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={styles.createText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
