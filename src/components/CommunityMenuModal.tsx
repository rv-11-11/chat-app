import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../utils/theme';
import { CommunityType } from '../types/community.type';

interface CommunityMenuModalProps {
  visible: boolean;
  onClose: () => void;
  community: CommunityType | null;
  onLeave: (community: CommunityType) => void;
  onJoin: (community: CommunityType) => void;
  onDelete: (community: CommunityType) => void;
  currentUserId: string;
  userCommunities: CommunityType[];
  publicCommunities: CommunityType[];
}

export default function CommunityMenuModal({
  visible,
  onClose,
  community,
  onLeave,
  onJoin,
  onDelete,
  currentUserId,
  userCommunities,
  publicCommunities,
}: CommunityMenuModalProps) {
  const { colors, spacing, radius, typography, shadows } = useAppTheme();

  if (!community) return null;

  // Helper to find the latest community object from lists
  const getFreshCommunity = (id: string) => {
    const fromMy = (userCommunities || []).find((c) => String(c._id) === String(id));
    if (fromMy) return fromMy;
    const fromPublic = (publicCommunities || []).find((c) => String(c._id) === String(id));
    return fromPublic || null;
  };

  const freshCommunity = getFreshCommunity(community._id);
  const target = freshCommunity || community;
  const targetMembers = target ? (target.members || []) : [];
  const targetAdmins = target ? (target.admins || []) : [];
  
  const isMember = currentUserId ? targetMembers.some((m: any) => (typeof m === 'string' ? m : m?._id) === currentUserId) : false;
  const isAdmin = currentUserId ? targetAdmins.some((a: any) => (typeof a === 'string' ? a : a?._id) === currentUserId) : false;

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    modalCard: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      ...shadows.lg,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: spacing.md,
    },
    actionBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
      marginBottom: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    actionBtnText: {
      color: colors.primaryForeground,
      fontSize: 14,
      fontWeight: '600',
    },
    cancelBtn: {
      backgroundColor: colors.background,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelBtnText: {
      color: colors.foreground,
    },
    deleteBtn: {
      backgroundColor: colors.destructive,
    },
  });

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>{target.name}</Text>
          
          {isMember && !isAdmin && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => onLeave(target)}>
              <Text style={styles.actionBtnText}>Leave Group</Text>
            </TouchableOpacity>
          )}
          
          {!isMember && target?.isPublic && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => onJoin(target)}>
              <Text style={styles.actionBtnText}>Join Group</Text>
            </TouchableOpacity>
          )}
          
          {isAdmin && (
            <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => onDelete(target)}>
              <Text style={styles.actionBtnText}>Delete Group</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={onClose}>
            <Text style={[styles.actionBtnText, styles.cancelBtnText]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
