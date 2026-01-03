import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useAppTheme } from '../utils/theme';
import { Avatar } from './Avatar';

interface AddExistingChatModalProps {
  visible: boolean;
  onClose: () => void;
  type: 'GROUP' | 'CHANNEL';
  options: any[];
  onSelect: (chatId: string, chatName: string) => void;
}

export default function AddExistingChatModal({ visible, onClose, type, options, onSelect }: AddExistingChatModalProps) {
  const { colors, spacing, radius, shadows, typography } = useAppTheme();

  const getChatName = (chat: any) => chat.groupName || chat.channelUsername || chat.groupUsername || 'Unnamed';

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
    modalActionText: {
      color: colors.foreground,
      fontWeight: '600',
    },
    item: {
      flexDirection: 'row',
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: radius.md,
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
    center: {
      padding: spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
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
          <Text style={styles.modalTitle}>
            Add {type === 'GROUP' ? 'Group' : 'Channel'}
          </Text>
          <View style={{ maxHeight: 320 }}>
            <FlatList
              data={options}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.item]}
                  onPress={() => onSelect(item._id, getChatName(item))}
                >
                  <View style={{ marginRight: spacing.md }}>
                    <Avatar
                      uri={item.icon}
                      name={getChatName(item)}
                      size={50}
                      shape="rounded"
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{getChatName(item)}</Text>
                    <Text style={styles.itemSubtitle}>
                      {type === 'GROUP'
                        ? `${item.participants?.length ?? 0} members`
                        : `${item.subscriberCount ?? item.participants?.length ?? 0} subscribers`}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={styles.emptyText}>No available chats to add</Text>
                </View>
              }
            />
          </View>
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
