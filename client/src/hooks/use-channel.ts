/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import type { UserType } from "@/types/auth.type";
import type { ChatType } from "@/types/chat.type";

export interface ChannelType extends ChatType {
  type: "CHANNEL";
  groupName?: string;  // Backend stores channel name as groupName
  channelDescription?: string;
  channelUsername?: string; // Unique username for channel (e.g., @channelname)
  admins: UserType[] | string[];
  isPublic: boolean;
  allowInviteLinkJoin?: boolean;
  subscriberCount: number;
}

interface ChannelState {
  channels: ChannelType[];
  currentChannel: ChannelType | null;
  subscriberList: UserType[];
  adminList: UserType[];
  publicChannels: {
    channels: ChannelType[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  } | null;

  isChannelsLoading: boolean;
  isCreatingChannel: boolean;
  isSubscribing: boolean;
  isUnsubscribing: boolean;
  isFetchingSubscribers: boolean;

  // Actions
  fetchUserChannels: () => Promise<void>;
  fetchPublicChannels: (page?: number, limit?: number, search?: string) => Promise<void>;
  createChannel: (data: {
    name: string;
    description?: string;
    isPublic: boolean;
    icon?: string;
  }) => Promise<ChannelType | null>;
  subscribeToChannel: (channelId: string) => Promise<void>;
  unsubscribeFromChannel: (channelId: string) => Promise<void>;
  promoteToAdmin: (channelId: string, userId: string) => Promise<void>;
  demoteAdmin: (channelId: string, userId: string) => Promise<void>;
  fetchChannelInfo: (channelId: string) => Promise<ChannelType | null>;
  setCurrentChannel: (channel: ChannelType | null) => void;
  updateChannel: (channelId: string, updates: Partial<ChannelType>) => void;

  // Socket listeners
  addChannel: (channel: ChannelType) => void;
  updateChannelSubscriber: (
    channelId: string,
    event: "joined" | "left"
  ) => void;
  updateChannelAdmin: (
    channelId: string,
    userId: string,
    action: "added" | "removed"
  ) => void;
  updateChannelUnread: (channelId: string, unreadCount: number) => void;
}

export const useChannel = create<ChannelState>()((set, get) => ({
  channels: [],
  currentChannel: null,
  subscriberList: [],
  adminList: [],
  publicChannels: null,

  isChannelsLoading: false,
  isCreatingChannel: false,
  isSubscribing: false,
  isUnsubscribing: false,
  isFetchingSubscribers: false,

  fetchUserChannels: async () => {
    set({ isChannelsLoading: true });
    try {
      const { data } = await API.get("/channel/user/my-channels");
      set({ channels: data.channels || [] });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch channels"
      );
    } finally {
      set({ isChannelsLoading: false });
    }
  },

  fetchPublicChannels: async (page = 1, limit = 20, search?: string) => {
    set({ isChannelsLoading: true });
    try {
      const params: any = { page, limit };
      if (search && search.trim()) {
        params.search = search.trim();
      }

      const { data } = await API.get("/channel/public", { params });
      
      // If page is 1, replace the data; otherwise, append to existing channels
      if (page === 1) {
        set({ publicChannels: data });
      } else {
        const currentState = get();
        const existingChannels = currentState.publicChannels?.channels || [];
        set({
          publicChannels: {
            ...data,
            channels: [...existingChannels, ...data.channels],
          },
        });
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch channels"
      );
    } finally {
      set({ isChannelsLoading: false });
    }
  },

  createChannel: async (data) => {
    set({ isCreatingChannel: true });
    try {
      const response = await API.post("/channel/create", data);
      get().addChannel(response.data.channel);
      toast.success("Channel created successfully");
      return response.data.channel;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create channel"
      );
      return null;
    } finally {
      set({ isCreatingChannel: false });
    }
  },

  subscribeToChannel: async (channelId) => {
    set({ isSubscribing: true });
    try {
      const { data } = await API.post(`/channel/${channelId}/subscribe`);
      get().addChannel(data.channel);
      toast.success("Subscribed to channel successfully");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to subscribe to channel"
      );
    } finally {
      set({ isSubscribing: false });
    }
  },

  unsubscribeFromChannel: async (channelId) => {
    set({ isUnsubscribing: true });
    try {
      await API.post(`/channel/${channelId}/unsubscribe`);
      set((state) => ({
        channels: state.channels.filter((c) => c._id !== channelId),
        currentChannel:
          state.currentChannel?._id === channelId ? null : state.currentChannel,
      }));
      toast.success("Unsubscribed from channel successfully");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to unsubscribe from channel"
      );
    } finally {
      set({ isUnsubscribing: false });
    }
  },

  promoteToAdmin: async (channelId, userId) => {
    try {
      const { data } = await API.post(
        `/channel/${channelId}/admin/${userId}/add`
      );
      set((state) => ({
        currentChannel:
          state.currentChannel?._id === channelId
            ? data.channel
            : state.currentChannel,
        channels: state.channels.map((c) =>
          c._id === channelId ? data.channel : c
        ),
      }));
      toast.success("User promoted to admin successfully");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to promote user"
      );
    }
  },

  demoteAdmin: async (channelId, userId) => {
    try {
      const { data } = await API.post(
        `/channel/${channelId}/admin/${userId}/remove`
      );
      set((state) => ({
        currentChannel:
          state.currentChannel?._id === channelId
            ? data.channel
            : state.currentChannel,
        channels: state.channels.map((c) =>
          c._id === channelId ? data.channel : c
        ),
      }));
      toast.success("User demoted successfully");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to demote user"
      );
    }
  },

  fetchChannelInfo: async (channelId) => {
    set({ isFetchingSubscribers: true });
    try {
      const { data } = await API.get(`/channel/${channelId}/info`);
      set({
        currentChannel: data.channel,
        subscriberList: data.channel.participants || [],
        adminList: data.channel.admins || [],
      });
      return data.channel;
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch channel info"
      );
      return null;
    } finally {
      set({ isFetchingSubscribers: false });
    }
  },

  setCurrentChannel: (channel) => {
    set({ currentChannel: channel });
  },

  updateChannel: (channelId, updates) => {
    set((state) => ({
      channels: state.channels.map((c) =>
        c._id === channelId ? { ...c, ...updates } : c
      ),
      currentChannel:
        state.currentChannel?._id === channelId
          ? { ...state.currentChannel, ...updates }
          : state.currentChannel,
    }));
  },

  addChannel: (channel) => {
    set((state) => {
      const existingIndex = state.channels.findIndex(
        (c) => c._id === channel._id
      );
      if (existingIndex !== -1) {
        return {
          channels: state.channels.map((c) =>
            c._id === channel._id ? channel : c
          ),
        };
      }
      return {
        channels: [channel, ...state.channels],
      };
    });
  },

  updateChannelSubscriber: (channelId, event) => {
    set((state) => {
      const channel = state.channels.find((c) => c._id === channelId);
      if (!channel) return state;

      const newCount =
        event === "joined"
          ? channel.subscriberCount + 1
          : Math.max(0, channel.subscriberCount - 1);

      return {
        channels: state.channels.map((c) =>
          c._id === channelId
            ? { ...c, subscriberCount: newCount }
            : c
        ),
        currentChannel:
          state.currentChannel?._id === channelId
            ? { ...state.currentChannel, subscriberCount: newCount }
            : state.currentChannel,
      };
    });
  },

  updateChannelAdmin: (channelId, userId, action) => {
    set((state) => {
      const channel = state.channels.find((c) => c._id === channelId);
      if (!channel) return state;

      const admins = Array.isArray(channel.admins)
        ? channel.admins.map((a) => (typeof a === "string" ? a : a._id))
        : [];

      const updatedAdmins =
        action === "added"
          ? Array.from(new Set([...admins, userId]))
          : admins.filter((id) => id !== userId);

      return {
        channels: state.channels.map((c) =>
          c._id === channelId
            ? { ...c, admins: updatedAdmins }
            : c
        ),
        currentChannel:
          state.currentChannel?._id === channelId
            ? { ...state.currentChannel, admins: updatedAdmins }
            : state.currentChannel,
      };
    });
  },

  updateChannelUnread: (channelId: string, unreadCount: number) => {
    set((state) => {
      return {
        channels: state.channels.map((c) =>
          c._id === channelId
            ? { ...c, unreadCount }
            : c
        ),
        currentChannel:
          state.currentChannel?._id === channelId
            ? { ...state.currentChannel, unreadCount }
            : state.currentChannel,
      };
    });
  },
}));
