import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'update' | 'system';
  timestamp: Date;
  read: boolean;
}

interface SettingsState {
  language: string;
  autoDownloadPhotos: boolean;
  autoDownloadVideos: boolean;
  autoDownloadDocuments: boolean;
  notifications: Notification[];
  notificationsEnabled: boolean;

  setLanguage: (language: string) => Promise<void>;
  setAutoDownloadPhotos: (enabled: boolean) => Promise<void>;
  setAutoDownloadVideos: (enabled: boolean) => Promise<void>;
  setAutoDownloadDocuments: (enabled: boolean) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'English',
  autoDownloadPhotos: true,
  autoDownloadVideos: true,
  autoDownloadDocuments: true,
  notifications: [],
  notificationsEnabled: true,

  loadSettings: async () => {
    try {
      const language = await AsyncStorage.getItem('app-language') || 'English';
      const autoDownloadPhotos = JSON.parse(await AsyncStorage.getItem('app-auto-download-photos') || 'true');
      const autoDownloadVideos = JSON.parse(await AsyncStorage.getItem('app-auto-download-videos') || 'true');
      const autoDownloadDocuments = JSON.parse(await AsyncStorage.getItem('app-auto-download-documents') || 'true');
      const notificationsEnabled = JSON.parse(await AsyncStorage.getItem('app-notifications-enabled') || 'true');
      
      set({
        language,
        autoDownloadPhotos,
        autoDownloadVideos,
        autoDownloadDocuments,
        notificationsEnabled,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  setLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('app-language', language);
      set({ language });
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  },

  setAutoDownloadPhotos: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('app-auto-download-photos', JSON.stringify(enabled));
      set({ autoDownloadPhotos: enabled });
    } catch (error) {
      console.error('Failed to save auto-download photos:', error);
    }
  },

  setAutoDownloadVideos: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('app-auto-download-videos', JSON.stringify(enabled));
      set({ autoDownloadVideos: enabled });
    } catch (error) {
      console.error('Failed to save auto-download videos:', error);
    }
  },

  setAutoDownloadDocuments: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('app-auto-download-documents', JSON.stringify(enabled));
      set({ autoDownloadDocuments: enabled });
    } catch (error) {
      console.error('Failed to save auto-download documents:', error);
    }
  },

  setNotificationsEnabled: async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('app-notifications-enabled', JSON.stringify(enabled));
      set({ notificationsEnabled: enabled });
    } catch (error) {
      console.error('Failed to save notifications enabled:', error);
    }
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
  },

  markNotificationAsRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      ),
    }));
  },

  clearNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((notif) => notif.id !== id),
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },
}));

