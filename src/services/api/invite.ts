import apiClient from './client';

export type InviteType = 'GROUP' | 'CHANNEL' | 'COMMUNITY';

export interface Invite {
  _id: string;
  sender: { _id: string; name: string; avatar?: string };
  targetId: string;
  targetType: InviteType;
  targetName?: string;
  targetIcon?: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt: string;
}

export const inviteApi = {
  createInvite: async (data: { targetId: string; targetType: InviteType; recipientId?: string; recipientEmail?: string }) => {
    const res = await apiClient.post('/invite', data);
    return res.data.invite;
  },

  getMyInvites: async () => {
    const res = await apiClient.get('/invite');
    return res.data.invites as Invite[];
  },

  respondToInvite: async (inviteId: string, action: 'accept' | 'decline') => {
    const res = await apiClient.post(`/invite/${inviteId}/respond`, { action });
    return res.data;
  }
};
