import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "message" | "update" | "system";
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

  setLanguage: (language: string) => void;
  setAutoDownloadPhotos: (enabled: boolean) => void;
  setAutoDownloadVideos: (enabled: boolean) => void;
  setAutoDownloadDocuments: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

// Migration: if old keys with 'iplay-' exist, copy them to 'LinkiPlay-' to preserve settings
const migrateIplayToLinkiPlay = () => {
  try {
    const mappings = [
      ["iplay-language", "LinkiPlay-language"],
      ["iplay-auto-download-photos", "LinkiPlay-auto-download-photos"],
      ["iplay-auto-download-videos", "LinkiPlay-auto-download-videos"],
      ["iplay-auto-download-documents", "LinkiPlay-auto-download-documents"],
      ["iplay-notifications-enabled", "LinkiPlay-notifications-enabled"],
    ];

    mappings.forEach(([oldKey, newKey]) => {
      const val = localStorage.getItem(oldKey);
      if (val !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, val);
      }
    });
  } catch {
    // ignore (localStorage may be unavailable in some environments)
  }
};

migrateIplayToLinkiPlay();

export const useSettings = create<SettingsState>()((set) => ({
  language: localStorage.getItem("LinkiPlay-language") || "English",
  autoDownloadPhotos: JSON.parse(localStorage.getItem("LinkiPlay-auto-download-photos") || "true"),
  autoDownloadVideos: JSON.parse(localStorage.getItem("LinkiPlay-auto-download-videos") || "true"),
  autoDownloadDocuments: JSON.parse(localStorage.getItem("LinkiPlay-auto-download-documents") || "true"),
  notifications: [],
  notificationsEnabled: JSON.parse(localStorage.getItem("LinkiPlay-notifications-enabled") || "true"),

  setLanguage: (language: string) => {
  localStorage.setItem("LinkiPlay-language", language);
    set({ language });
  },

  setAutoDownloadPhotos: (enabled: boolean) => {
  localStorage.setItem("LinkiPlay-auto-download-photos", JSON.stringify(enabled));
    set({ autoDownloadPhotos: enabled });
  },

  setAutoDownloadVideos: (enabled: boolean) => {
  localStorage.setItem("LinkiPlay-auto-download-videos", JSON.stringify(enabled));
    set({ autoDownloadVideos: enabled });
  },

  setAutoDownloadDocuments: (enabled: boolean) => {
  localStorage.setItem("LinkiPlay-auto-download-documents", JSON.stringify(enabled));
    set({ autoDownloadDocuments: enabled });
  },

  setNotificationsEnabled: (enabled: boolean) => {
  localStorage.setItem("LinkiPlay-notifications-enabled", JSON.stringify(enabled));
    set({ notificationsEnabled: enabled });
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
