import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert, Image } from 'react-native';
import { useThemeColors } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useInviteStore } from '../store/inviteStore';
import { InviteType } from '../services/api/invite';
import { userApi } from '../services/api/user'; 
import { User } from '../types/auth.types';

interface InviteUserDialogProps {
  visible: boolean;
  onClose: () => void;
  targetId: string;
  targetType: InviteType;
  targetName: string;
}

export default function InviteUserDialog({ visible, onClose, targetId, targetType, targetName }: InviteUserDialogProps) {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<'search' | 'email'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { sendInvite } = useInviteStore();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
        setSearchResults([]);
        return;
    }
    setLoading(true);
    try {
        const result = await userApi.searchUsers(query);
        setSearchResults(result.users || []);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  const handleSendInvite = async (recipientId?: string, recipientEmail?: string) => {
    try {
        await sendInvite({
            targetId,
            targetType,
            recipientId,
            recipientEmail
        });
        Alert.alert("Success", "Invite sent successfully");
        if (recipientEmail) setEmail('');
    } catch (error) {
        Alert.alert("Error", (error as any).message || "Failed to send invite");
    }
  };

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    dialog: { backgroundColor: colors.card, borderRadius: 16, padding: 20, maxHeight: '80%' },
    title: { fontSize: 20, fontWeight: 'bold', color: colors.foreground, marginBottom: 4, textAlign: 'center' },
    subtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 20, textAlign: 'center' },
    tabs: { flexDirection: 'row', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    activeTab: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: { fontWeight: '600', color: colors.mutedForeground },
    activeTabText: { color: colors.primary },
    input: { backgroundColor: colors.background, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, color: colors.foreground, marginBottom: 16 },
    userItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    userName: { fontWeight: '600', color: colors.foreground },
    userEmail: { fontSize: 12, color: colors.mutedForeground },
    inviteBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    inviteBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    sendButton: { backgroundColor: colors.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    sendButtonText: { color: '#fff', fontWeight: 'bold' },
    closeButton: { position: 'absolute', top: 10, right: 10, padding: 5 }
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.overlay}>
            <View style={styles.dialog}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.mutedForeground} />
                </TouchableOpacity>
                
                <Text style={styles.title}>Invite to {targetName}</Text>
                <Text style={styles.subtitle}>Add members to this {targetType.toLowerCase()}</Text>

                <View style={styles.tabs}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'search' && styles.activeTab]} 
                        onPress={() => setActiveTab('search')}
                    >
                        <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>Search Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'email' && styles.activeTab]} 
                        onPress={() => setActiveTab('email')}
                    >
                        <Text style={[styles.tabText, activeTab === 'email' && styles.activeTabText]}>By Email</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'search' ? (
                    <View>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Search by name or username..." 
                            placeholderTextColor={colors.mutedForeground}
                            value={searchQuery}
                            onChangeText={handleSearch}
                        />
                        {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: 10 }} />}
                        <FlatList
                            data={searchResults}
                            keyExtractor={item => item._id}
                            style={{ maxHeight: 300 }}
                            renderItem={({ item }) => (
                                <View style={styles.userItem}>
                                    {item.avatar ? (
                                        <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
                                    ) : (
                                        <View style={styles.avatar}>
                                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.name?.[0]}</Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.userName}>{item.name}</Text>
                                        <Text style={styles.userEmail}>{item.email}</Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.inviteBtn}
                                        onPress={() => handleSendInvite(item._id)}
                                    >
                                        <Text style={styles.inviteBtnText}>Invite</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            ListEmptyComponent={searchQuery.length > 1 && !loading ? <Text style={{ textAlign: 'center', color: colors.mutedForeground }}>No users found</Text> : null}
                        />
                    </View>
                ) : (
                    <View>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Enter email address" 
                            placeholderTextColor={colors.mutedForeground}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity 
                            style={styles.sendButton}
                            onPress={() => handleSendInvite(undefined, email)}
                        >
                            <Text style={styles.sendButtonText}>Send Invite</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    </Modal>
  );
}
