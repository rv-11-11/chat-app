import { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { channelApi } from '../services/api/channel';

interface Props { visible: boolean; onClose: () => void }

export default function ChannelCreateModal({ visible, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return alert('Channel name required');
    setLoading(true);
    try {
      await channelApi.createChannel({ name: name.trim(), description: description.trim(), isPublic });
      onClose();
    } catch (err) {
      console.error('Create channel failed', err);
      alert('Failed to create channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>Create Channel</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
          </View>

          <View style={{ padding: 16 }}>
            <TextInput style={styles.input} placeholder="Channel name" value={name} onChangeText={setName} />
            <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Description (optional)" value={description} onChangeText={setDescription} />
            <TouchableOpacity style={[styles.toggleButton, { backgroundColor: isPublic ? '#007AFF' : '#999' }]} onPress={() => setIsPublic(!isPublic)}>
              <Text style={{ color: '#fff' }}>{isPublic ? 'Public' : 'Private'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.createText}>Create Channel</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  content: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  header: { fontSize: 18, fontWeight: '700' },
  close: { fontSize: 20, color: '#666' },
  input: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 },
  toggleButton: { marginTop: 12, padding: 10, borderRadius: 8, alignItems: 'center' },
  createBtn: { marginTop: 16, backgroundColor: '#007AFF', padding: 14, borderRadius: 10, alignItems: 'center' },
  createText: { color: '#fff', fontWeight: '700' },
});
