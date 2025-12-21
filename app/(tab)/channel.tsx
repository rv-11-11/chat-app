import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import "../../global.css";
import ChannelCreateModal from '../../src/components/ChannelCreateModal';
import { channelApi } from '../../src/services/api/channel';
import { useThemeColors } from '../../src/utils/theme';

export default function ChannelListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await channelApi.getUserChannels();
      console.log('Fetched channels:', res.channels);
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
    container: { 
      flex: 1, 
      backgroundColor: colors.background,
      paddingTop: insets.top,
    },
    header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: 20, 
      paddingVertical: 16, 
      borderBottomWidth: 0.5, 
      borderBottomColor: colors.border, 
      backgroundColor: colors.card, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.06, 
      shadowRadius: 8, 
      elevation: 3,
    },
    headerTitle: { 
      fontSize: 32, 
      fontWeight: '800', 
      color: colors.foreground, 
      letterSpacing: -0.5,
    },
    newButton: { 
      backgroundColor: colors.primary, 
      paddingHorizontal: 16, 
      paddingVertical: 10, 
      borderRadius: 10, 
      shadowColor: colors.primary, 
      shadowOffset: { width: 0, height: 2 }, 
      shadowOpacity: 0.25, 
      shadowRadius: 5, 
      elevation: 3,
    },
    newButtonText: { 
      color: colors.primaryForeground, 
      fontWeight: '700', 
      fontSize: 14,
    },
    item: { 
      flexDirection: 'row', 
      paddingHorizontal: 16, 
      paddingVertical: 14, 
      alignItems: 'center', 
      marginHorizontal: 16, 
      marginVertical: 6, 
      borderRadius: 12, 
      backgroundColor: colors.card, 
      borderWidth: 0.8, 
      borderColor: colors.border, 
      shadowColor: '#000', 
      shadowOffset: { width: 0, height: 1 }, 
      shadowOpacity: 0.05, 
      shadowRadius: 3, 
      elevation: 2,
      gap: 14,
    },
    avatar: { 
      width: 56, 
      height: 56, 
      borderRadius: 28, 
      backgroundColor: colors.primary, 
      justifyContent: 'center', 
      alignItems: 'center',
    },
    avatarText: { 
      color: colors.primaryForeground, 
      fontSize: 20, 
      fontWeight: '700',
    },
    info: { 
      flex: 1,
      gap: 6,
    },
    title: { 
      fontSize: 16, 
      fontWeight: '700', 
      color: colors.foreground, 
      letterSpacing: -0.2,
    },
    subtitle: { 
      fontSize: 13, 
      color: colors.mutedForeground, 
      fontWeight: '400',
    },
    center: { 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    subscriberCount: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.mutedForeground,
      fontWeight: '500',
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 10,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.mutedForeground,
      textAlign: 'center',
      fontWeight: '500',
    },
  });

  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.item} 
      onPress={() => router.push(`/channel/${item._id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.icon? item.icon : item.channelUsername.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.channelUsername}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{item.channelDescription || 'No description'}</Text>
      </View>
      <View>
        <Text style={styles.subscriberCount}>
          {(item.participants?.length) || 0} subscribers
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Loading channels...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Channels</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => setIsCreateOpen(true)}>
          <Text style={styles.newButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList 
        data={channels} 
        keyExtractor={(i) => i._id} 
        renderItem={renderItem} 
        contentContainerStyle={{ paddingVertical: 12 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No channels yet</Text>
            <Text style={styles.emptySubtext}>Create one to get started</Text>
          </View>
        } 
      />

      <ChannelCreateModal 
        visible={isCreateOpen} 
        onClose={() => { 
          setIsCreateOpen(false); 
          fetchChannels(); 
        }} 
      />
    </View>
  );
}

