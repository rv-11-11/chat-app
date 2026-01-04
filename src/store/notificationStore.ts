import { create } from 'zustand';
import { notificationApi } from '../services/api/notification';

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
  sender?: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  fetchNotifications: () => Promise<void>;
  markAsRead: (ids: string[] | 'all') => Promise<void>;
  addNotification: (notification: Notification) => void;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  
  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { notifications, unreadCount } = await notificationApi.getNotifications();
      set({ notifications, unreadCount });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  markAsRead: async (ids) => {
    try {
      await notificationApi.markAsRead(ids);
      set((state) => {
        const newNotifications = state.notifications.map(n => {
          if (ids === 'all' || (Array.isArray(ids) && ids.includes(n._id))) {
            return { ...n, isRead: true };
          }
          return n;
        });
        const newUnreadCount = newNotifications.filter(n => !n.isRead).length;
        return { notifications: newNotifications, unreadCount: newUnreadCount };
      });
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  },
  
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  deleteNotification: async (id) => {
      try {
          await notificationApi.deleteNotification(id);
          set((state) => ({
              notifications: state.notifications.filter(n => n._id !== id),
              unreadCount: state.notifications.find(n => n._id === id && !n.isRead) 
                ? state.unreadCount - 1 
                : state.unreadCount
          }));
      } catch (error) {
          console.error('Failed to delete notification:', error);
      }
  }
}));
