import { create } from "zustand";
import { API } from "@/lib/axios-client";
import { toast } from "sonner";
import { useAuth } from "./use-auth";

export interface CommunityType {
  lastMessage: any;
  _id: string;
  name: string;
  username?: string;
  description?: string;
  icon?: string;
  members: string[];
  admins: string[];
  groups: string[];
  channels: string[];
  isPublic: boolean;
  allowInviteLinkJoin?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CommunityState {
  communities: CommunityType[];
  publicCommunities: { communities: CommunityType[]; total: number } | null;
  currentCommunity: CommunityType | null;

  isCommunitiesLoading: boolean;
  isCreatingCommunity: boolean;

  // Actions
  fetchUserCommunities: () => Promise<void>;
  fetchPublicCommunities: (page?: number, limit?: number) => Promise<void>;
  createCommunity: (data: {
    name: string;
    description?: string;
    isPublic: boolean;
    icon?: string;
  }) => Promise<CommunityType | null>;
  getCommunityService: (communityId: string) => Promise<CommunityType | null>;
  addChatToCommunity: (communityId: string, chatId: string, chatType: "GROUP" | "CHANNEL") => Promise<void>;
  removeChatFromCommunity: (communityId: string, chatId: string) => Promise<void>;
  setCurrentCommunity: (community: CommunityType | null) => void;

  joinCommunity: (communityId: string) => Promise<void>;
  leaveCommunity: (communityId: string) => Promise<void>;
  deleteCommunity: (communityId: string) => Promise<boolean>;

  // Socket listeners
  addCommunity: (community: CommunityType) => void;
}

export const useCommunity = create<CommunityState>()((set, get) => ({
  communities: [],
  publicCommunities: null,
  currentCommunity: null,

  isCommunitiesLoading: false,
  isCreatingCommunity: false,

  fetchUserCommunities: async () => {
    set({ isCommunitiesLoading: true });
    try {
      const response = await API.get("/community/my");
      set({ communities: response.data.communities });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to fetch communities"
      );
    } finally {
      set({ isCommunitiesLoading: false });
    }
  },

  fetchPublicCommunities: async (page = 1, limit = 20) => {
    set({ isCommunitiesLoading: true });
    try {
      const response = await API.get("/community/public", {
        params: { page, limit },
      });
      
      // If page is 1, replace the data; otherwise, append to existing communities
      if (page === 1) {
        set({ publicCommunities: response.data });
      } else {
        const currentState = get();
        const existingCommunities = currentState.publicCommunities?.communities || [];
        set({
          publicCommunities: {
            ...response.data,
            communities: [...existingCommunities, ...response.data.communities],
          },
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to fetch public communities"
      );
    } finally {
      set({ isCommunitiesLoading: false });
    }
  },

  createCommunity: async (data) => {
    set({ isCreatingCommunity: true });
    try {
      const response = await API.post("/community/create", data);
      get().addCommunity(response.data.community);
      toast.success("Community created successfully");
      return response.data.community;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to create community"
      );
      return null;
    } finally {
      set({ isCreatingCommunity: false });
    }
  },

  getCommunityService: async (communityId) => {
    try {
      const response = await API.get(`/community/${communityId}`);
      set({ currentCommunity: response.data.community });
      return response.data.community;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to fetch community"
      );
      return null;
    }
  },

  addChatToCommunity: async (communityId, chatId, chatType) => {
    try {
      const response = await API.post(`/community/${communityId}/chat/add`, {
        chatId,
        chatType,
      });
      set({ currentCommunity: response.data.community });
      toast.success("Chat added to community successfully");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to add chat");
    }
  },

  addMemberToCommunity: async (communityId: string, memberId: string) => {
    try {
      const response = await API.post(`/community/${communityId}/member/${memberId}/add`);
      set({ currentCommunity: response.data.community });
      toast.success("Member added to community successfully");
      return response.data.community;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to add member to community");
      return null;
    }
  },

  removeChatFromCommunity: async (communityId, chatId) => {
    try {
      const response = await API.post(`/community/${communityId}/remove-chat`, {
        chatId,
      });
      set({ currentCommunity: response.data.community });
      toast.success("Chat removed from community successfully");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to remove chat");
    }
  },

  setCurrentCommunity: (community) => {
    set({ currentCommunity: community });
  },

  joinCommunity: async (communityId) => {
    try {
      const response = await API.post(`/community/${communityId}/join`);
      const joined = response.data.community;

      set((state) => ({
        communities: [
          joined,
          ...state.communities.filter((c) => c._id !== joined._id),
        ],
      }));

      toast.success("Joined community successfully");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to join community"
      );
    }
  },

  leaveCommunity: async (communityId) => {
    try {
      const { user } = useAuth.getState();
      if (!user?._id) {
        toast.error("User not found");
        return;
      }
      await API.delete(`/community/${communityId}/member/${user._id}`);
      set((state) => ({
        communities: state.communities.filter((c) => c._id !== communityId),
        currentCommunity:
          state.currentCommunity?._id === communityId
            ? null
            : state.currentCommunity,
      }));
      toast.success("Left community successfully");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Failed to leave community"
      );
    }
  },

  deleteCommunity: async (communityId: string) => {
    try {
      await API.delete(`/community/${communityId}`);
      set((state) => ({
        communities: state.communities.filter((c) => c._id !== communityId),
        currentCommunity: state.currentCommunity?._id === communityId ? null : state.currentCommunity,
      }));
      toast.success("Community deleted successfully");
      return true;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to delete community");
      return false;
    }
  },

  addCommunity: (community) => {
    set((state) => {
      if (state.communities.some((c) => c._id === community._id)) {
        return state;
      }
      return {
        communities: [community, ...state.communities],
      };
    });
  },
}));
