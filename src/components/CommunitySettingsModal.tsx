import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Image } from 'react-native';
import { useAppTheme } from '../utils/theme';
import * as ImagePicker from 'expo-image-picker';
import { SmartImage } from './SmartImage';

interface CommunitySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  community: any;
  onSave: (data: { name: string; description: string; isPublic: boolean; allowInviteLinkJoin: boolean; icon?: string }) => void;
}

export default function CommunitySettingsModal({ visible, onClose, community, onSave }: CommunitySettingsModalProps) {
  const { colors, spacing, radius, shadows, typography } = useAppTheme();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowInviteLinkJoin, setAllowInviteLinkJoin] = useState(true);
  const [icon, setIcon] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (community && visible) {
      setName(community.name || '');
      setDescription(community.description || '');
      setIsPublic(!!community.isPublic);
      setAllowInviteLinkJoin(community.allowInviteLinkJoin !== false);
      setIcon(community.icon);
    }
  }, [community, visible]);

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        quality: 0.5,
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [1, 1],
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Error', 'Image too large. Maximum size is 5MB.');
          return;
        }

        const base64 = asset.base64;
        const finalImage = base64?.startsWith('data:')
          ? base64
          : `data:image/jpeg;base64,${base64}`;

        setIcon(finalImage);
      }
    } catch (err) {
      console.error('Image pick error', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = () => {
    onSave({
      name: name.trim() || community?.name,
      description: description.trim(),
      isPublic,
      allowInviteLinkJoin,
      icon,
    });
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    modalCard: {
      width: '100%',
      maxWidth: 500,
      borderRadius: radius.lg,
      backgroundColor: colors.card,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadows.lg,
    },
    modalTitle: {
      ...typography.h3,
      color: colors.foreground,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.foreground,
      backgroundColor: colors.background,
      marginBottom: spacing.sm,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    settingLabel: {
      color: colors.foreground,
      ...typography.body,
    },
    toggleBtn: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    toggleBtnInactive: {
      backgroundColor: colors.background,
    },
    toggleText: {
      fontSize: 14,
      fontWeight: '600',
    },
    toggleTextActive: {
      color: colors.primaryForeground,
    },
    toggleTextInactive: {
      color: colors.foreground,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    modalAction: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    modalActionPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modalActionText: {
      color: colors.foreground,
      fontWeight: '600',
    },
    modalActionTextPrimary: {
      color: colors.primaryForeground,
    },
    imageSection: {
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    imagePreview: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: spacing.xs,
    },
    imagePlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    imagePlaceholderText: {
      color: colors.primaryForeground,
      fontSize: 32,
      fontWeight: 'bold',
    },
    changePhotoText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
  });

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Community Settings</Text>
          
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickImage}>
              {icon ? (
                <SmartImage source={{ uri: icon }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>
                    {(name || 'C').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.changePhotoText}>Change Icon</Text>
            </TouchableOpacity>
          </View>

          <TextInput 
            style={styles.input} 
            placeholder="Name" 
            placeholderTextColor={colors.mutedForeground} 
            value={name} 
            onChangeText={setName} 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Description" 
            placeholderTextColor={colors.mutedForeground} 
            value={description} 
            onChangeText={setDescription} 
          />
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Public</Text>
            <TouchableOpacity
              style={[
                styles.toggleBtn, 
                isPublic ? styles.toggleBtnActive : styles.toggleBtnInactive
              ]}
              onPress={() => setIsPublic(!isPublic)}
            >
              <Text style={[
                styles.toggleText, 
                isPublic ? styles.toggleTextActive : styles.toggleTextInactive
              ]}>
                {isPublic ? 'Yes' : 'No'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Allow Invite Link Join</Text>
            <TouchableOpacity
              style={[
                styles.toggleBtn, 
                allowInviteLinkJoin ? styles.toggleBtnActive : styles.toggleBtnInactive
              ]}
              onPress={() => setAllowInviteLinkJoin(!allowInviteLinkJoin)}
            >
              <Text style={[
                styles.toggleText, 
                allowInviteLinkJoin ? styles.toggleTextActive : styles.toggleTextInactive
              ]}>
                {allowInviteLinkJoin ? 'Yes' : 'No'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalAction} onPress={onClose}>
              <Text style={styles.modalActionText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalAction, styles.modalActionPrimary]} onPress={handleSave}>
              <Text style={[styles.modalActionText, styles.modalActionTextPrimary]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
