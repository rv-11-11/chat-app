/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { toast } from "sonner";

interface PendingMessage {
  id: string;
  chatId: string;
  content?: string;
  image?: string;
  file?: any;
  replyToId?: string;
  createdAt: number;
  status: "pending" | "sending" | "failed";
}

interface OfflineQueueState {
  isOnline: boolean;
  pendingMessages: PendingMessage[];
  failedMessages: PendingMessage[];

  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  addPendingMessage: (message: PendingMessage) => void;
  removePendingMessage: (messageId: string) => void;
  markMessageAsSending: (messageId: string) => void;
  markMessageAsFailed: (messageId: string) => void;
  clearPendingMessages: () => void;
  clearFailedMessages: () => void;
  getPendingMessages: () => PendingMessage[];
  getFailedMessages: () => PendingMessage[];
}

export const useOfflineQueue = create<OfflineQueueState>()((set, get) => {
  // Listen for online/offline events
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      set({ isOnline: true });
      toast.success("Back online!");
    });

    window.addEventListener("offline", () => {
      set({ isOnline: false });
      toast.info("You are offline. Messages will be sent when online.");
    });
  }

  return {
    isOnline: typeof window !== "undefined" ? navigator.onLine : true,
    pendingMessages: [],
    failedMessages: [],

    setOnlineStatus: (isOnline) => {
      set({ isOnline });
    },

    addPendingMessage: (message) => {
      set((state) => ({
        pendingMessages: [...state.pendingMessages, message],
      }));

      // Try to sync with service worker if available
      if (
        typeof window !== "undefined" &&
        navigator.serviceWorker &&
        navigator.serviceWorker.ready
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          if ("sync" in registration) {
            (registration as any).sync.register("sync-messages").catch(() => {
              // Background sync registration failed
            });
          }
        });
      }
    },

    removePendingMessage: (messageId) => {
      set((state) => ({
        pendingMessages: state.pendingMessages.filter(
          (msg) => msg.id !== messageId
        ),
      }));
    },

    markMessageAsSending: (messageId) => {
      set((state) => ({
        pendingMessages: state.pendingMessages.map((msg) =>
          msg.id === messageId ? { ...msg, status: "sending" } : msg
        ),
      }));
    },

    markMessageAsFailed: (messageId) => {
      set((state) => {
        const failedMessage = state.pendingMessages.find(
          (msg) => msg.id === messageId
        );
        if (!failedMessage) return state;

        return {
          pendingMessages: state.pendingMessages.filter(
            (msg) => msg.id !== messageId
          ),
          failedMessages: [
            ...state.failedMessages,
            { ...failedMessage, status: "failed" },
          ],
        };
      });
    },

    clearPendingMessages: () => {
      set({ pendingMessages: [] });
    },

    clearFailedMessages: () => {
      set({ failedMessages: [] });
    },

    getPendingMessages: () => {
      return get().pendingMessages;
    },

    getFailedMessages: () => {
      return get().failedMessages;
    },
  };
});
