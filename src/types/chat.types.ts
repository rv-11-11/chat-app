import { User } from './auth.types';

export type ChatType = 'DIRECT' | 'GROUP' | 'CHANNEL';

export interface Chat {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  type: ChatType;
  isGroup?: boolean;
  groupName?: string;
  groupUsername?: string;
  channelDescription?: string;
  description?: string; // Unified description field
  name?: string; // Unified name field
  channelUsername?: string;
  icon?: string;
  admins: (string | User)[];
  isPublic: boolean;
  subscriberCount?: number;
  createdBy: string;
  unreadBy?: string[];
  unreadCount?: number;
  allowInviteLinkJoin?: boolean;
  strictMode?: boolean;
  isFeatured?: boolean;
  featuredUntil?: Date;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  chatId: string;
  content?: string | null;
  image?: string | null;
  video?: {
    url?: string;
    name?: string;
    duration?: number;
    thumbnail?: string;
    size?: number;
  } | null;
  file?: {
    url: string;
    name: string;
    type: string;
    size: number;
  } | null;
  sender: User | null;
  replyTo?: Message | null;
  messageType?: 'USER' | 'SYSTEM';
  viewCount?: number;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
  status?: 'sending' | 'sent' | 'failed';
}

export interface CreateChatData {
  participantId?: string;
  isGroup?: boolean;
  participants?: string[];
  groupName?: string;
  icon?: string;
  type?: ChatType;
  description?: string;
  groupDescription?: string;
  isPublic?: boolean;
  strictMode?: boolean;
}

export interface CreateMessageData {
  chatId: string;
  content?: string;
  image?: string;
  video?: {
    data: string;
    name: string;
    type: string;
    size: number;
  };
  replyToId?: string;
  nsfwScores?: Array<{ className: string; probability: number }>;
}


