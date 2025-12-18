import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useSocketStore } from '../../src/store/socketStore';
import { useThemeColors } from '../../src/utils/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ProfileEditDialog from '../../src/components/ProfileEditDialog';
import { isUserOnline } from '../../src/utils/helpers';

export default function MyProfileScreen() {
  const { user } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const isOnline = user ? isUserOnline(user._id, onlineUsers) : false;

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
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{getInitials(user.name || 'U')}</Text>
              </View>
            )}
            {isOnline && <View style={styles.onlineBadge} />}
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
    padding: 16,
    paddingTop: 24,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    paddingRight: 50,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingBottom: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarImage: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  avatarPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  username: {
    fontSize: 18,
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
  },
  infoSection: {
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 12,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoValueSmall: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  editSection: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
