import { create } from 'zustand';
import { communityApi, type CreateCommunityData } from '../services/api/community';
import type { CommunityType } from '../types/community.type';
import { useAuthStore } from './authStore';

interface CommunityState {
	communities: CommunityType[];
	publicCommunities: { communities: CommunityType[]; total: number } | null;
	currentCommunity: CommunityType | null;

	isCommunitiesLoading: boolean;
	isCreatingCommunity: boolean;
	isCreateOpen: boolean;

	fetchUserCommunities: () => Promise<void>;
	fetchPublicCommunities: (page?: number, limit?: number) => Promise<void>;
	createCommunity: (data: CreateCommunityData) => Promise<CommunityType | null>;
	getCommunity: (communityId: string) => Promise<CommunityType | null>;
	addChatToCommunity: (communityId: string, chatId: string, chatType: 'GROUP' | 'CHANNEL') => Promise<void>;
	removeChatFromCommunity: (communityId: string, chatId: string) => Promise<void>;
	addMemberToCommunity: (communityId: string, memberId: string) => Promise<CommunityType | null>;
	setCurrentCommunity: (community: CommunityType | null) => void;
	setIsCreateOpen: (isOpen: boolean) => void;

	joinCommunity: (communityId: string) => Promise<void>;
	leaveCommunity: (communityId: string) => Promise<void>;
	deleteCommunity: (communityId: string) => Promise<boolean>;

	updateCommunity: (communityId: string, data: Partial<{ name: string; description?: string; icon?: string; isPublic?: boolean; allowInviteLinkJoin?: boolean }>) => Promise<CommunityType | null>;

	addCommunity: (community: CommunityType) => void;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
	communities: [],
	publicCommunities: null,
	currentCommunity: null,

	isCommunitiesLoading: false,
	isCreatingCommunity: false,
	isCreateOpen: false,

	fetchUserCommunities: async () => {
		set({ isCommunitiesLoading: true });
		try {
			const response = await communityApi.getMyCommunities();
			set({ communities: response.communities });
		} catch (error) {
			console.error('Failed to fetch communities:', error);
			throw error;
		} finally {
			set({ isCommunitiesLoading: false });
		}
	},

	fetchPublicCommunities: async (page = 1, limit = 20) => {
		set({ isCommunitiesLoading: true });
		try {
			const response = await communityApi.getPublicCommunities(page, limit);
			if (page === 1) {
				set({ publicCommunities: response });
			} else {
				const existing = get().publicCommunities?.communities || [];
				// Avoid duplicates while appending paginated communities
				const merged = [...existing, ...response.communities.filter((c) => !existing.some((e) => e._id === c._id))];
				set({ publicCommunities: { total: response.total, communities: merged } });
			}
		} catch (error) {
			console.error('Failed to fetch public communities:', error);
			throw error;
		} finally {
			set({ isCommunitiesLoading: false });
		}
	},

	createCommunity: async (data) => {
		set({ isCreatingCommunity: true });
		try {
			const response = await communityApi.createCommunity(data);
			set((state) => ({ communities: [response.community, ...state.communities] }));
			return response.community;
		} catch (error) {
			console.error('Failed to create community:', error);
			throw error;
		} finally {
			set({ isCreatingCommunity: false });
		}
	},

	getCommunity: async (communityId) => {
		set({ isCommunitiesLoading: true });
		try {
			const response = await communityApi.getCommunity(communityId);
			set({ currentCommunity: response.community });
			return response.community;
		} catch (error) {
			console.error('Failed to fetch community:', error);
			return null;
		} finally {
			set({ isCommunitiesLoading: false });
		}
	},

	addChatToCommunity: async (communityId, chatId, chatType) => {
		try {
			const response = await communityApi.addChatToCommunity(communityId, chatId, chatType);
			set({ currentCommunity: response.community });
			set((state) => ({
				communities: state.communities.map((c) => (c._id === response.community._id ? response.community : c)),
			}));
		} catch (error) {
			console.error('Failed to add chat to community:', error);
			throw error;
		}
	},

	removeChatFromCommunity: async (communityId, chatId) => {
		try {
			const response = await communityApi.removeChatFromCommunity(communityId, chatId);
			set({ currentCommunity: response.community });
			set((state) => ({
				communities: state.communities.map((c) => (c._id === response.community._id ? response.community : c)),
			}));
		} catch (error) {
			console.error('Failed to remove chat from community:', error);
			throw error;
		}
	},

	addMemberToCommunity: async (communityId, memberId) => {
		try {
			const response = await communityApi.addMember(communityId, memberId);
			set({ currentCommunity: response.community });
			set((state) => ({
				communities: state.communities.map((c) => (c._id === response.community._id ? response.community : c)),
			}));
			return response.community;
		} catch (error) {
			console.error('Failed to add member to community:', error);
			return null;
		}
	},

	setCurrentCommunity: (community) => {
		set({ currentCommunity: community });
	},

	setIsCreateOpen: (isOpen) => {
		set({ isCreateOpen: isOpen });
	},

	joinCommunity: async (communityId) => {
		try {
			const response = await communityApi.joinCommunity(communityId);
			set((state) => ({
				communities: [response.community, ...state.communities.filter((c) => c._id !== response.community._id)],
			}));
			// Update public communities cache so joined community reflects membership state
			set((state) => {
				if (!state.publicCommunities) return state;
				return {
					publicCommunities: {
						total: state.publicCommunities.total,
						communities: state.publicCommunities.communities.map((c) =>
							c._id === response.community._id ? response.community : c
						),
					},
				};
			});
		} catch (error) {
			console.error('Failed to join community:', error);
			throw error;
		}
	},

	leaveCommunity: async (communityId) => {
		try {
			const userId = useAuthStore.getState().user?._id;
			if (!userId) {
				throw new Error('User not found');
			}
			await communityApi.leaveCommunity(communityId, userId);
			set((state) => ({
				communities: state.communities.filter((c) => c._id !== communityId),
				currentCommunity: state.currentCommunity?._id === communityId ? null : state.currentCommunity,
			}));
			set((state) => {
				if (!state.publicCommunities) return state;
				return {
					publicCommunities: {
						total: state.publicCommunities.total,
						communities: state.publicCommunities.communities.map((c) =>
							c._id === communityId
								? { ...c, members: c.members.filter((m) => m !== userId) }
								: c
						),
					},
				};
			});
		} catch (error) {
			console.error('Failed to leave community:', error);
			throw error;
		}
	},

	deleteCommunity: async (communityId) => {
		try {
			await communityApi.deleteCommunity(communityId);
			set((state) => ({
				communities: state.communities.filter((c) => c._id !== communityId),
				currentCommunity: state.currentCommunity?._id === communityId ? null : state.currentCommunity,
			}));
			set((state) => {
				if (!state.publicCommunities) return state;
				return {
					publicCommunities: {
						total: Math.max(0, state.publicCommunities.total - 1),
						communities: state.publicCommunities.communities.filter((c) => c._id !== communityId),
					},
				};
			});
			return true;
		} catch (error) {
			console.error('Failed to delete community:', error);
			return false;
		}
	},

	updateCommunity: async (communityId, data) => {
		try {
			const response = await communityApi.updateCommunity(communityId, data);
			set({ currentCommunity: response.community });
			set((state) => ({
				communities: state.communities.map((c) => (c._id === response.community._id ? response.community : c)),
			}));
			return response.community;
		} catch (error) {
			console.error('Failed to update community:', error);
			return null;
		}
	},

	addCommunity: (community) => {
		set((state) => {
			if (state.communities.some((c) => c._id === community._id)) {
				return state;
			}
			return { communities: [community, ...state.communities] };
		});
	},
}));
