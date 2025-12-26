import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useSocketStore } from '../../src/store/socketStore';
import { useThemeColors } from '../../src/utils/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ProfileEditDialog from '../../src/components/ProfileEditDialog';
import { isUserOnline } from '../../src/utils/helpers';
import { Avatar } from '../../src/components/Avatar';

export default function MyProfileScreen() {
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Current user is always online
  const isOnline = true;

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      scrollEnabled={true}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            try {
              navigation.goBack();
            } catch {
              router.replace('/(tab)/chat');
            }
          }}
          style={[styles.closeButton, { backgroundColor: colors.muted }]}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name="times" size={20} color={colors.foreground} />
        </TouchableOpacity>


        <Text style={[styles.title, { color: colors.foreground }]}>My Profile</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          View and manage your profile information
        </Text>
      </View>

      {/* Main Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Profile Avatar Section */}
        <View style={[styles.avatarSection, { borderBottomColor: colors.border }]}>
          <View style={styles.avatarContainer}>
            <Avatar
              uri={user.avatar || undefined}
              name={user.name || 'U'}
              size={96}
              isOnline={isOnline}
              showStatus={true}
              shape="circle"
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.foreground }]}>
              {user.name || 'Unknown User'}
            </Text>
            {user.username && (
              <Text style={[styles.username, { color: colors.primary }]}>
                @{user.username}
              </Text>
            )}
            <Text style={[styles.status, { color: colors.mutedForeground }]}>
              {isOnline ? '🟢 Online' : '⚪ Offline'}
            </Text>
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.infoSection}>
          {/* Email */}
          {user.email && (
            <View style={[styles.infoItem, { backgroundColor: colors.muted }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primary + '20' }]}>
                <FontAwesome name="envelope" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Email Address
                </Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                  {user.email}
                </Text>
              </View>
            </View>
          )}

          {/* Phone */}
          {user.phone && (
            <View style={[styles.infoItem, { backgroundColor: colors.muted }]}>
              <View style={[styles.infoIcon, { backgroundColor: '#4CAF50' + '20' }]}>
                <FontAwesome name="phone" size={20} color="#4CAF50" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Phone Number
                </Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                  {user.phone}
                </Text>
              </View>
            </View>
          )}

          {/* User ID */}
          {user._id && (
            <View style={[styles.infoItem, { backgroundColor: colors.muted }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.mutedForeground + '20' }]}>
                <FontAwesome name="shield" size={20} color={colors.mutedForeground} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  User ID
                </Text>
                <Text style={[styles.infoValueSmall, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {user._id}
                </Text>
              </View>
            </View>
          )}

          {/* Account Created Date */}
          {user.createdAt && (
            <View style={[styles.infoItem, { backgroundColor: colors.muted }]}>
              <View style={[styles.infoIcon, { backgroundColor: '#FF9800' + '20' }]}>
                <FontAwesome name="calendar" size={20} color="#FF9800" />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Member Since
                </Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Edit Button */}
        <View style={[styles.editSection, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => setIsEditDialogOpen(true)}
          >
            <FontAwesome name="edit" size={16} color={colors.primaryForeground} />
            <Text style={[styles.editButtonText, { color: colors.primaryForeground }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Dialog */}
      <ProfileEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    marginBottom: 28,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -8,
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    paddingRight: 50,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  card: {
    borderRadius: 14,
    padding: 20,
    borderWidth: 0.8,
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingBottom: 22,
    marginBottom: 22,
    borderBottomWidth: 0.8,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '700',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
    gap: 4,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  username: {
    fontSize: 15,
    fontWeight: '500',
  },
  status: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoSection: {
    gap: 12,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoValueSmall: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  editSection: {
    paddingTop: 16,
    borderTopWidth: 0.8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
