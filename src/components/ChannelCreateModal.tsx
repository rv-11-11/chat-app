import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { channelApi } from '../services/api/channel';
import { useAppTheme } from '../utils/theme';

interface Props { 
  visible: boolean; 
  onClose: () => void;
  onCreated?: (channel: any) => void;
}

export default function ChannelCreateModal({ visible, onClose, onCreated }: Props) {
  const { colors, spacing, radius, typography, shadows } = useAppTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert('Validation', 'Channel name required');
    setLoading(true);
    try {
      const result = await channelApi.createChannel({ name: name.trim(), description: description.trim(), isPublic });
      if (onCreated && result?.channel) {
        onCreated(result.channel);
      }
      onClose();
    } catch (err) {
      console.error('Create channel failed', err);
      Alert.alert('Error', 'Failed to create channel');
    } finally {
      setLoading(false);
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
      borderRadius: radius.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.foreground,
    },
    toggleButton: { 
      marginTop: spacing.sm, 
      padding: spacing.md, 
      borderRadius: radius.md, 
      alignItems: 'center' 
    },
    createBtn: { 
      marginTop: spacing.xl, 
      backgroundColor: colors.primary, 
      padding: spacing.lg, 
      borderRadius: radius.lg, 
      alignItems: 'center',
      ...shadows.md
    },
    createText: { 
      color: colors.primaryForeground, 
      fontWeight: '700',
      fontSize: 16
    },
  });

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Create Channel</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <TextInput 
              style={styles.input} 
              placeholder="Channel name" 
              placeholderTextColor={colors.mutedForeground}
              value={name} 
              onChangeText={setName} 
            />
            <TextInput 
              style={[styles.input, { marginTop: spacing.xs }]} 
              placeholder="Description (optional)" 
              placeholderTextColor={colors.mutedForeground}
              value={description} 
              onChangeText={setDescription} 
            />
            <TouchableOpacity 
              style={[styles.toggleButton, { backgroundColor: isPublic ? colors.primary : colors.muted }]} 
              onPress={() => setIsPublic(!isPublic)}
            >
              <Text style={{ color: isPublic ? colors.primaryForeground : colors.mutedForeground, fontWeight: '600' }}>
                {isPublic ? '🌐 Public' : '🔒 Private'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.createText}>Create Channel</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
