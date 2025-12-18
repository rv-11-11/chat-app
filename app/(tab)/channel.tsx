import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import "../../global.css";
import { channelApi } from '../../src/services/api/channel';
import ChannelCreateModal from '../../src/components/ChannelCreateModal';
import { useThemeColors } from '../../src/utils/theme';

export default function ChannelListScreen() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await channelApi.getUserChannels();
      setChannels(res.channels || []);
    } catch (err) {
      console.error('Failed to fetch channels', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15, borderBottomWidth: 0.5, borderBottomColor: colors.border, backgroundColor: colors.card, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: colors.foreground, letterSpacing: -0.5 },
    newButton: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 3 },
    newButtonText: { color: colors.primaryForeground, fontWeight: '700', fontSize: 14 },
    item: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 13, alignItems: 'center', marginHorizontal: 10, marginVertical: 6, borderRadius: 16, backgroundColor: colors.card, borderWidth: 0.8, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 13 },
    avatarText: { color: colors.primaryForeground, fontSize: 22, fontWeight: '800' },
    info: { flex: 1 },
    title: { fontSize: 16, fontWeight: '700', color: colors.foreground, letterSpacing: -0.2 },
    subtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 4, fontWeight: '400' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  });

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.item} onPress={() => { /* navigate to channel chat */ }}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{(item.name || 'C').charAt(0).toUpperCase()}</Text></View>
      <View style={styles.info}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>{item.description || ''}</Text>
      </View>
      <View style={{ justifyContent: 'center' }}>
        <Text style={{ color: colors.primary }}>{item.subscriberCount || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ marginTop: 8, color: colors.mutedForeground }}>Loading channels...</Text></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Channels</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => setIsCreateOpen(true)}>
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList data={channels} keyExtractor={(i) => i._id} renderItem={renderItem} ListEmptyComponent={<View style={styles.center}><Text style={{ color: colors.mutedForeground }}>No channels yet</Text></View>} />

      <ChannelCreateModal visible={isCreateOpen} onClose={() => { setIsCreateOpen(false); fetchChannels(); }} />
    </View>
  );
}

