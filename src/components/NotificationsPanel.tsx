import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { useThemeColors } from '../utils/theme';
import Switch from './Switch';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function NotificationsPanel() {
  const {
    notifications,
    notificationsEnabled,
    setNotificationsEnabled,
    clearNotification,
    clearAllNotifications,
    markNotificationAsRead,
  } = useSettingsStore();
  const colors = useThemeColors();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <FontAwesome name="comment" size={20} color="#3b82f6" />;
      case 'update':
        return <FontAwesome name="exclamation-circle" size={20} color="#a855f7" />;
      case 'system':
        return <FontAwesome name="info-circle" size={20} color="#10b981" />;
      default:
        return <FontAwesome name="bell" size={20} color={colors.foreground} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, { color: colors.foreground }]}>
            Enable Notifications
          </Text>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </View>
      </View>

      {notifications.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.muted }]}>
          <FontAwesome name="bell" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No notifications yet
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                {
                  backgroundColor: notification.read ? colors.muted : colors.primary + '15',
                  borderColor: notification.read ? colors.border : colors.primary + '50',
                },
              ]}
              onPress={() => markNotificationAsRead(notification.id)}
            >
              <View style={styles.notificationIcon}>
                {getNotificationIcon(notification.type)}
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: colors.foreground }]}>
                  {notification.title}
                </Text>
                <Text
                  style={[styles.notificationMessage, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {notification.message}
                </Text>
                <Text style={[styles.notificationTime, { color: colors.mutedForeground }]}>
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  clearNotification(notification.id);
                }}
                style={styles.deleteButton}
              >
                <FontAwesome name="trash" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          {notifications.length > 0 && (
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: colors.border }]}
              onPress={clearAllNotifications}
            >
              <Text style={[styles.clearButtonText, { color: colors.foreground }]}>
                Clear All Notifications
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  header: {
    gap: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 14,
  },
  emptyState: {
    padding: 48,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  notificationsList: {
    maxHeight: 400,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  notificationIcon: {
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    marginTop: 4,
  },
  deleteButton: {
    padding: 4,
  },
  clearButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});



