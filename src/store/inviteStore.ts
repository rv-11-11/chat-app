import { create } from 'zustand';
import { inviteApi, Invite } from '../services/api/invite';

interface InviteState {
  invites: Invite[];
  isLoading: boolean;
  fetchInvites: () => Promise<void>;
  respondToInvite: (inviteId: string, action: 'accept' | 'decline') => Promise<void>;
  sendInvite: (data: { targetId: string; targetType: 'GROUP' | 'CHANNEL' | 'COMMUNITY'; recipientId?: string; recipientEmail?: string }) => Promise<void>;
}

export const useInviteStore = create<InviteState>((set, get) => ({
  invites: [],
  isLoading: false,

  fetchInvites: async () => {
    set({ isLoading: true });
    try {
      const invites = await inviteApi.getMyInvites();
      set({ invites });
    } catch (error) {
      console.error('Failed to fetch invites', error);
    } finally {
      set({ isLoading: false });
    }
  },

  respondToInvite: async (inviteId, action) => {
    try {
      await inviteApi.respondToInvite(inviteId, action);
      // Optimistic update
      set((state) => ({
        invites: state.invites.filter((i) => i._id !== inviteId)
      }));
    } catch (error) {
      console.error('Failed to respond to invite', error);
      throw error;
    }
  },

  sendInvite: async (data) => {
    try {
        await inviteApi.createInvite(data);
    } catch (error) {
        console.error('Failed to send invite', error);
        throw error;
    }
  }
}));
