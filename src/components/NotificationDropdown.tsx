import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, ScrollView, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../utils/theme';
import { useNotificationStore } from '../store/notificationStore';
import { formatChatTime } from '../utils/helpers';

const NotificationDropdown = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const { notifications, unreadCount, fetchNotifications, markAsRead, deleteNotification, isLoading } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const toggleDropdown = () => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    } else {
      setVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  };
  
  const handleMarkAllRead = () => {
    markAsRead('all');
  };
  
  const handleNotificationPress = (notification: any) => {
    if (!notification.isRead) {
      markAsRead([notification._id]);
    }
    
    toggleDropdown();

    // Navigate based on notification type/data
    if (notification.data) {
      const { chatId, channelId, groupId, communityId } = notification.data;
      
      if (chatId) {
        router.push(`/chat/${chatId}`);
      } else if (channelId) {
        router.push(`/channel/${channelId}`);
      } else if (groupId) {
        router.push(`/group/${groupId}`);
      } else if (communityId) {
        router.push(`/community/${communityId}`);
      }
    }
  };

  const handleDelete = (e: any, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const headerHeight = 60; // Approximate header height
  const topPosition = insets.top + headerHeight;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleDropdown} style={styles.iconButton}>
        <Ionicons name="notifications-outline" size={24} color={colors.foreground} />
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
            <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal transparent visible={visible} onRequestClose={toggleDropdown}>
        <TouchableWithoutFeedback onPress={toggleDropdown}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.dropdown, 
                  { 
                    top: topPosition,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.headerTitle, { color: colors.foreground }]}>Notifications</Text>
                  <TouchableOpacity onPress={handleMarkAllRead}>
                    <Text style={[styles.markRead, { color: colors.primary }]}>Mark all read</Text>
                  </TouchableOpacity>
                </View>

                {isLoading && notifications.length === 0 ? (
                   <View style={{ padding: 20, alignItems: 'center' }}>
                      <ActivityIndicator color={colors.primary} />
                   </View>
                ) : notifications.length === 0 ? (
                   <View style={{ padding: 20, alignItems: 'center' }}>
                      <Text style={{ color: colors.mutedForeground }}>No notifications</Text>
                   </View>
                ) : (
                  <ScrollView style={styles.list}>
                    {notifications.map((item) => (
                      <TouchableOpacity 
                        key={item._id} 
                        style={[
                          styles.item, 
                          { backgroundColor: item.isRead ? 'transparent' : `${colors.primary}10` }
                        ]}
                        onPress={() => handleNotificationPress(item)}
                      >
                        <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                          <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
                        </View>
                        <View style={styles.content}>
                          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{item.title}</Text>
                          <Text style={[styles.message, { color: colors.mutedForeground }]} numberOfLines={2}>{item.message}</Text>
                          <Text style={[styles.time, { color: colors.mutedForeground }]}>
                            {formatChatTime(item.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.actions}>
                          {!item.isRead && (
                            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                          )}
                          <TouchableOpacity 
                            onPress={(e) => handleDelete(e, item._id)}
                            style={styles.deleteBtn}
                          >
                            <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
    zIndex: 1000,
  },
  iconButton: {
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdown: {
    position: 'absolute',
    right: 16,
    width: 320,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
    maxHeight: 450,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  markRead: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    maxHeight: 390,
  },
  item: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
  },
  actions: {
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
    paddingVertical: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  deleteBtn: {
    padding: 4,
  }
});

export default NotificationDropdown;
// file ends here
