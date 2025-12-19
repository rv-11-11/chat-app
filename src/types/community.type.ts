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