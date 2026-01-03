import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '../utils/theme';
import { userApi } from '../services/api/user';
import { normalizeId } from '../utils/helpers'; // Assuming this exists or I'll implement it locally if simpler
import { Avatar } from './Avatar';

// Helper if not imported
const normalizeIdHelper = (value: any) => (typeof value === 'string' ? value : value?._id || '');

interface AddMemberModalProps {
  visible: boolean;
  onClose: () => void;
  currentMembers: any[];
  onSelect: (userId: string) => void;
}

export default function AddMemberModal({ visible, onClose, currentMembers, onSelect }: AddMemberModalProps) {
  const { colors, spacing, radius, shadows, typography } = useAppTheme();
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<any[]>([]);
  const [memberSearching, setMemberSearching] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setMemberQuery('');
      setMemberResults([]);
      setMemberSearching(false);
    }
  }, [visible]);

  // Live user search
  useEffect(() => {
    if (!visible) return;
    if (memberQuery.trim().length < 2) {
      setMemberResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setMemberSearching(true);
      try {
        const res = await userApi.searchUsers(memberQuery.trim());
        const currentMemberIds = (currentMembers || []).map(normalizeIdHelper);
        const filtered = (res.users || []).filter((u: any) => !currentMemberIds.includes(u._id));
        setMemberResults(filtered);
      } catch (err) {
        console.error('Search users failed', err);
        setMemberResults([]);
      } finally {
        setMemberSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [memberQuery, visible, currentMembers]);

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
    item: {
      flexDirection: 'row',
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    itemInfo: {
      flex: 1,
    },
    itemTitle: {
      ...typography.bodySemibold,
      color: colors.foreground,
    },
    itemSubtitle: {
      ...typography.caption,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    emptyText: {
      ...typography.body,
      color: colors.mutedForeground,
      textAlign: 'center',
    },
  });

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add Members</Text>
          <TextInput
            style={styles.input}
            placeholder="Search users (2+ chars)"
            placeholderTextColor={colors.mutedForeground}
            value={memberQuery}
            onChangeText={setMemberQuery}
          />
          {memberSearching ? (
            <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={memberResults}
              keyExtractor={(item) => item._id}
              style={{ maxHeight: 280 }}
              renderItem={({ item }) => (
                <View style={styles.item}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    {item.username && (
                      <Text style={styles.itemSubtitle}>@{item.username}</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={[styles.modalAction, styles.modalActionPrimary, { flex: 0, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }]} 
                    onPress={() => onSelect(item._id)}
                  >
                    <Text style={[styles.modalActionText, styles.modalActionTextPrimary]}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
                  <Text style={styles.emptyText}>No users found</Text>
                </View>
              }
            />
          )}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalAction} onPress={onClose}>
              <Text style={styles.modalActionText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
